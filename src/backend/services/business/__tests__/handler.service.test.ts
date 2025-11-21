import "reflect-metadata";
import { container } from "tsyringe";
import { HandlerService } from "../handler.service.js";
import { ReaderPromptService } from "../reader-prompt.service.js";
import { LLMSenderService } from "../../../../core/services/llm-sender.service.js";
import { LLMChainService } from "../../../../core/services/llm-chain.service.js";
import { ConverterModels } from "../../../../core/converter.models.js";
import { LOGGER_TOKEN } from "../../../../core/di/tokens.js";
import { DataRequest } from "../../../../core/interfaces/protocol/datarequest.interface.js";
import { ConfigChainPrompt } from "../../../../core/interfaces/protocol/configchainprompt.interface.js";

// Mock external functions
jest.mock("../../databases/redis/redis.service.js", () => ({
    getChainWithHistory: jest.fn()
}));
jest.mock("../../../templates/chainpromptbase.template.js", () => ({
    getPromptTemplate: jest.fn()
}));
jest.mock("../../common.service.js", () => ({
    ENDPOINT_CHATGENERICA: "generic-chat",
    SYSTEMPROMPT_DFL: "default-system-prompt"
}));

describe("HandlerService", () => {
    let service: HandlerService;
    let mockLogger: any;
    let mockReaderPromptService: jest.Mocked<ReaderPromptService>;
    let mockConverterModels: jest.Mocked<ConverterModels>;
    let mockLLMSenderService: jest.Mocked<LLMSenderService>;
    let mockLLMChainService: jest.Mocked<LLMChainService>;

    // External mocks
    const { getChainWithHistory } = require("../../databases/redis/redis.service.js");
    const { getPromptTemplate } = require("../../../templates/chainpromptbase.template.js");

    beforeEach(() => {
        container.clearInstances();

        // Mock Logger
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        };
        container.register(LOGGER_TOKEN, { useValue: mockLogger });

        // Mock Services
        mockReaderPromptService = {
            getFrameworkPrompts: jest.fn(),
        } as any;

        mockConverterModels = {
            getDataRequestDFL: jest.fn(),
            getDataRequest: jest.fn(),
        } as any;

        mockLLMSenderService = {
            senderToLLM: jest.fn(),
            senderToAgent: jest.fn(),
        } as any;

        mockLLMChainService = {
            getInstanceLLM: jest.fn(),
        } as any;

        service = new HandlerService(
            mockLogger,
            mockReaderPromptService,
            mockConverterModels,
            mockLLMSenderService,
            mockLLMChainService
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("handleLLM", () => {
        it("should process LLM request correctly", async () => {
            const systemPrompt = "sys-prompt";
            const inputData: DataRequest = {
                question: "hello",
                keyconversation: "key1",
                noappendchat: false,
                config: { modelname: "gpt-4" } as ConfigChainPrompt
            };
            const mockChain = {};
            const mockLLMInstance = {};
            const mockPromptTemplate = {};

            (getChainWithHistory as jest.Mock).mockResolvedValue(mockChain);
            mockLLMChainService.getInstanceLLM.mockReturnValue(mockLLMInstance as any);
            (getPromptTemplate as jest.Mock).mockReturnValue(mockPromptTemplate);
            mockLLMSenderService.senderToLLM.mockResolvedValue("response");

            const result = await service.handleLLM(systemPrompt, inputData);

            expect(result).toBe("response");
            expect(mockLLMChainService.getInstanceLLM).toHaveBeenCalledWith(inputData.config);
            expect(getChainWithHistory).toHaveBeenCalledWith(systemPrompt, mockLLMInstance, inputData.noappendchat, inputData.keyconversation);
            expect(mockLLMSenderService.senderToLLM).toHaveBeenCalledWith(inputData, systemPrompt, mockPromptTemplate, mockChain);
        });

        it("should handle errors in handleLLM", async () => {
            const error = new Error("LLM Error");
            mockLLMChainService.getInstanceLLM.mockImplementation(() => { throw error; });

            await expect(service.handleLLM("prompt", {} as DataRequest)).rejects.toThrow("LLM Error");
        });
    });

    describe("handleAgent", () => {
        it("should delegate to senderToAgent", async () => {
            const systemPrompt = "sys-prompt";
            const inputData: DataRequest = {
                question: "hello",
                keyconversation: "key1",
                config: { modelname: "agent-model" } as ConfigChainPrompt
            };
            const tools: any[] = [];
            const middleware: any[] = [];
            const agentName = "agent1";

            mockLLMSenderService.senderToAgent.mockResolvedValue("agent-response" as any);

            const result = await service.handleAgent(systemPrompt, inputData, tools, middleware, agentName);

            expect(result).toBe("agent-response");
            expect(mockLLMSenderService.senderToAgent).toHaveBeenCalledWith(
                inputData.question,
                inputData.keyconversation,
                inputData.config,
                systemPrompt,
                tools,
                middleware,
                agentName
            );
        });
    });

    describe("getDataByResponseHttp", () => {
        it("should prepare data from HTTP request", async () => {
            const req = { body: { text: "hello" } };
            const context = "specific-context";
            const identifier = "id1";
            const preprocessor = jest.fn();
            const isAgent = false;

            const mockDefaultData = { config: { timeout: 1000 } };
            const mockUpdateData = { question: "hello", config: { timeout: 2000 } };

            mockConverterModels.getDataRequestDFL.mockReturnValue(mockDefaultData as any);
            mockConverterModels.getDataRequest.mockReturnValue(mockUpdateData as any);
            mockReaderPromptService.getFrameworkPrompts.mockResolvedValue("fetched-prompt");

            const result = await service.getDataByResponseHttp(req, context, identifier, preprocessor, isAgent);

            expect(preprocessor).toHaveBeenCalledWith(req);
            expect(mockConverterModels.getDataRequestDFL).toHaveBeenCalled();
            expect(mockReaderPromptService.getFrameworkPrompts).toHaveBeenCalledWith(context);
            expect(mockConverterModels.getDataRequest).toHaveBeenCalledWith(req.body, context, identifier, isAgent);

            expect(result.systemPrompt).toBe("fetched-prompt");
            expect(result.resultData.config.timeout).toBe(2000); // Should override default
        });

        it("should use default system prompt for generic chat", async () => {
            const req = { body: {} };
            const context = "generic-chat"; // Matches ENDPOINT_CHATGENERICA mock
            const identifier = "id1";
            const preprocessor = jest.fn();

            mockConverterModels.getDataRequestDFL.mockReturnValue({ keyconversation: "test", config: {} as any } as any);
            mockConverterModels.getDataRequest.mockReturnValue({ keyconversation: "test", config: {} as any } as any);

            const result = await service.getDataByResponseHttp(req, context, identifier, preprocessor);

            expect(mockReaderPromptService.getFrameworkPrompts).not.toHaveBeenCalled();
            expect(result.systemPrompt).toBe("default-system-prompt");
        });
    });
});
