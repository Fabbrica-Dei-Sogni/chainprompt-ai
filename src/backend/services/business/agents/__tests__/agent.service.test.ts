import "reflect-metadata";
import { container } from "tsyringe";
import { LOGGER_TOKEN } from "../../../../../core/di/tokens.js";
import { ConfigChainPrompt } from "../../../../../core/interfaces/protocol/configchainprompt.interface.js";

// Mock dependencies
jest.mock("../../../common.service.js", () => ({
    ENDPOINT_CHATGENERICA: "generic-chat",
    SYSTEMPROMPT_DFL: "default-system-prompt"
}));
jest.mock("../../../databases/postgresql/postgresql.service.js", () => ({
    postgresqlService: {
        getCheckpointer: jest.fn()
    }
}));

describe("AgentService", () => {
    let AgentServiceClass: any;
    let service: any;
    let mockLogger: any;
    let mockMiddlewareService: any;
    let mockReaderPromptService: any;
    let mockLLMAgentService: any;
    let mockLLMChainService: any;
    let mockGetComponent: jest.Mock;

    beforeEach(() => {
        jest.resetModules();
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
        mockMiddlewareService = {
            handleToolErrors: {},
            createSummaryMemoryMiddleware: jest.fn(),
        };

        mockReaderPromptService = {
            getFrameworkPrompts: jest.fn(),
        };

        mockLLMAgentService = {
            getAgent: jest.fn(),
        };

        mockLLMChainService = {
            getInstanceLLM: jest.fn(),
        };

        // Mock getComponent
        mockGetComponent = jest.fn((token: any) => {
            if (token.name === "LLMAgentService") return mockLLMAgentService;
            if (token.name === "LLMChainService") return mockLLMChainService;
            return {};
        });

        jest.doMock("../../../../../core/di/container.js", () => ({
            getComponent: mockGetComponent
        }));

        // Require service under test
        const module = require("../agent.service.js");
        AgentServiceClass = module.AgentService;

        service = new AgentServiceClass(mockLogger, mockMiddlewareService, mockReaderPromptService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("buildAgent", () => {
        it("should build an agent with correct configuration", async () => {
            const context = "test-context";
            const config: ConfigChainPrompt = { modelname: "gpt-4", provider: "openai" as any };
            const tools: any[] = [];
            const middleware: any[] = [];

            mockReaderPromptService.getFrameworkPrompts.mockResolvedValue("framework-prompt");
            mockLLMChainService.getInstanceLLM.mockReturnValue("llm-instance");
            mockLLMAgentService.getAgent.mockReturnValue("agent-instance");

            const result = await service.buildAgent(context, config, tools, middleware);

            expect(result).toBe("agent-instance");
            expect(mockReaderPromptService.getFrameworkPrompts).toHaveBeenCalledWith(context);
            expect(mockLLMChainService.getInstanceLLM).toHaveBeenCalledWith(config);
            expect(mockLLMAgentService.getAgent).toHaveBeenCalledWith(
                "llm-instance",
                "framework-prompt",
                tools,
                middleware,
                "Mr." + context,
                undefined // checkpointer mock returns undefined by default
            );
        });

        it("should use default system prompt for generic chat", async () => {
            const context = "generic-chat"; // Matches ENDPOINT_CHATGENERICA mock
            const config: ConfigChainPrompt = { modelname: "gpt-4", provider: "openai" as any };

            mockLLMChainService.getInstanceLLM.mockReturnValue("llm-instance");

            await service.buildAgent(context, config);

            expect(mockReaderPromptService.getFrameworkPrompts).not.toHaveBeenCalled();
            expect(mockLLMAgentService.getAgent).toHaveBeenCalledWith(
                "llm-instance",
                "default-system-prompt",
                expect.any(Array),
                expect.any(Array),
                "Mr.generic-chat",
                undefined
            );
        });
    });
});
