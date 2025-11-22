import "reflect-metadata";
import { container } from "tsyringe";
import { AgentController } from "../handler.agent.controller.js";
import { LOGGER_TOKEN } from "../../../../core/di/tokens.js";
import { LLMProvider } from "../../../../core/enums/llmprovider.enum.js";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../../../errors/custom-errors.js";

// Mock dependencies
jest.mock("request-ip", () => ({
    getClientIp: jest.fn().mockReturnValue("127.0.0.1")
}));

jest.mock("../../../utils/clickbaitscore.util.js", () => ({
    decodeBase64: jest.fn().mockReturnValue("decoded-url")
}));

jest.mock("../../../services/common.service.js", () => ({
    CONTEXT_MANAGER: "manager-context"
}));

jest.mock("../../../services/databases/redis/redis.service.js", () => ({
    redisService: {}
}));

describe("AgentController", () => {
    let controller: AgentController;
    let mockLogger: any;
    let mockAgentService: any;
    let mockMiddlewareService: any;
    let mockHandlerService: any;
    let mockReaderPromptService: any;
    let mockConverterModels: any;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

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
        mockAgentService = {
            buildAgent: jest.fn().mockResolvedValue("agent-instance")
        };
        mockMiddlewareService = {
            handleToolErrors: {},
            createSummaryMemoryMiddleware: jest.fn()
        };
        mockHandlerService = {
            getDataByResponseHttp: jest.fn(),
            handleAgent: jest.fn(),
            defaultPreprocessor: jest.fn()
        };
        mockReaderPromptService = {
            getSectionsPrompts: jest.fn().mockResolvedValue("prompt-section")
        };
        mockConverterModels = {
            getAgentContent: jest.fn().mockReturnValue("agent-answer")
        };

        controller = new AgentController(
            mockLogger,
            mockAgentService,
            mockMiddlewareService,
            mockHandlerService,
            mockReaderPromptService,
            mockConverterModels
        );

        // Mock Request and Response
        mockReq = {
            body: {},
            originalUrl: "/api/agent/test-context",
            params: {},
            query: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("agentManagerHandler", () => {
        it("should handle agent manager request", async () => {
            mockHandlerService.getDataByResponseHttp.mockResolvedValue({
                systemPrompt: "sys-prompt",
                resultData: {
                    keyconversation: "key",
                    config: { modelname: "model" }
                }
            });
            mockHandlerService.handleAgent.mockResolvedValue("agent-result");

            await controller.agentManagerHandler(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                LLMProvider.OpenAICloud,
                [],
                ["sub-context"]
            );

            expect(mockHandlerService.getDataByResponseHttp).toHaveBeenCalledWith(
                expect.anything(),
                "manager-context",
                "127.0.0.1",
                expect.anything(),
                true
            );
            expect(mockAgentService.buildAgent).toHaveBeenCalledWith("sub-context", expect.anything());
            expect(mockHandlerService.handleAgent).toHaveBeenCalled();
            expect(mockConverterModels.getAgentContent).toHaveBeenCalledWith("agent-result");
            expect(mockRes.json).toHaveBeenCalledWith("agent-answer");
        });
    });

    describe("handleCommonAgentRequest", () => {
        it("should handle common agent request", async () => {
            mockHandlerService.getDataByResponseHttp.mockResolvedValue({
                systemPrompt: "sys-prompt",
                resultData: { config: { modelname: "model" } }
            });
            mockHandlerService.handleAgent.mockResolvedValue("agent-result");

            await controller.handleCommonAgentRequest(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                LLMProvider.OpenAICloud
            );

            expect(mockHandlerService.getDataByResponseHttp).toHaveBeenCalledWith(
                expect.anything(),
                "test-context",
                "127.0.0.1",
                mockHandlerService.defaultPreprocessor,
                true
            );
            expect(mockRes.json).toHaveBeenCalledWith("agent-answer");
        });
    });

    describe("handleClickbaitAgent", () => {
        it("should handle clickbait agent request", async () => {
            mockReq.body = { url: "encoded-url" };
            mockHandlerService.getDataByResponseHttp.mockImplementation(async (req: any, ctx: any, ip: any, preprocessor: any) => {
                await preprocessor(req);
                return { systemPrompt: "sys", resultData: { config: { modelname: "model" } } };
            });
            mockHandlerService.handleAgent.mockResolvedValue("agent-result");

            await controller.handleClickbaitAgent(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                LLMProvider.OpenAICloud
            );

            expect(mockReq.body.question).toBe("decoded-url");
            expect(mockReq.body.noappendchat).toBe(true);
            expect(mockRes.json).toHaveBeenCalledWith("agent-answer");
        });

        it("should handle missing url error", async () => {
            mockReq.body = {}; // Missing url
            mockHandlerService.getDataByResponseHttp.mockImplementation(async (req: any, ctx: any, ip: any, preprocessor: any) => {
                await preprocessor(req); // This will throw ValidationError
                return { systemPrompt: "sys", resultData: { config: { modelname: "model" } } };
            });

            await controller.handleClickbaitAgent(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                LLMProvider.OpenAICloud
            );

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    message: expect.stringContaining("URL mancante"),
                    fields: expect.objectContaining({ url: "Required" })
                })
            );
        });
    });

    describe("handleCyberSecurityAgent", () => {
        it("should handle cybersecurity agent request", async () => {
            mockHandlerService.getDataByResponseHttp.mockResolvedValue({
                systemPrompt: "sys",
                resultData: { config: { modelname: "model" } }
            });
            mockHandlerService.handleAgent.mockResolvedValue("agent-result");

            await controller.handleCyberSecurityAgent(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                LLMProvider.OpenAICloud
            );

            expect(mockHandlerService.getDataByResponseHttp).toHaveBeenCalledWith(
                expect.anything(),
                "threatintel",
                expect.anything(),
                expect.anything(),
                true
            );
            expect(mockRes.json).toHaveBeenCalledWith("agent-answer");
        });
    });
});
