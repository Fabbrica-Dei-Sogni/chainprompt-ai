import "reflect-metadata";
import { container } from "tsyringe";
import { LLMController } from "../handler.llm.controller.js";
import { LOGGER_TOKEN } from "../../../../core/di/tokens.js";
import { HandlerService } from "../../../services/business/handler.service.js";
import { LLMProvider } from "../../../../core/enums/llmprovider.enum.js";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../../../errors/custom-errors.js";

// Mock dependencies
jest.mock("request-ip", () => ({
    getClientIp: jest.fn().mockReturnValue("127.0.0.1")
}));

jest.mock("../../../utils/analisicommenti.util.js", () => ({
    formatCommentsForPrompt: jest.fn().mockReturnValue("formatted-comments")
}));

jest.mock("../../../utils/cheshire.util.js", () => ({
    removeCheshireCatText: jest.fn().mockReturnValue("clean-text")
}));

jest.mock("../../../utils/clickbaitscore.util.js", () => ({
    decodeBase64: jest.fn().mockReturnValue("decoded-url"),
    scrapeArticle: jest.fn().mockResolvedValue({ title: "Title", content: "Content" })
}));

jest.mock("../../../services/databases/redis/redis.service.js", () => ({
    redisService: {}
}));

describe("LLMController", () => {
    let controller: LLMController;
    let mockLogger: any;
    let mockHandlerService: any;
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

        // Mock HandlerService
        mockHandlerService = {
            getDataByResponseHttp: jest.fn(),
            handleLLM: jest.fn(),
            defaultPreprocessor: jest.fn()
        };

        controller = new LLMController(mockLogger, mockHandlerService);

        // Mock Request and Response
        mockReq = {
            body: {},
            originalUrl: "/api/llm/test-context",
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

    describe("handleCommonRequest", () => {
        it("should handle common request", async () => {
            mockHandlerService.getDataByResponseHttp.mockResolvedValue({
                systemPrompt: "sys-prompt",
                resultData: { key: "val" }
            });
            mockHandlerService.handleLLM.mockResolvedValue({ answer: "response" });

            await controller.handleCommonRequest(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                LLMProvider.OpenAICloud
            );

            expect(mockHandlerService.getDataByResponseHttp).toHaveBeenCalledWith(
                expect.objectContaining({ body: expect.objectContaining({ provider: LLMProvider.OpenAICloud }) }),
                "test-context",
                "127.0.0.1",
                mockHandlerService.defaultPreprocessor,
                false
            );
            expect(mockHandlerService.handleLLM).toHaveBeenCalledWith("sys-prompt", { key: "val" });
            expect(mockRes.json).toHaveBeenCalledWith({ answer: "response" });
        });
    });

    describe("handleClickbaitRequest", () => {
        it("should handle clickbait request", async () => {
            mockReq.body = { url: "encoded-url" };
            mockHandlerService.getDataByResponseHttp.mockImplementation(async (req: any, ctx: any, ip: any, preprocessor: any) => {
                await preprocessor(req); // Execute preprocessor
                return { systemPrompt: "sys", resultData: {} };
            });
            mockHandlerService.handleLLM.mockResolvedValue({});

            await controller.handleClickbaitRequest(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                LLMProvider.OpenAICloud
            );

            // Verify preprocessor effects
            expect(mockReq.body.question).toContain("<TITOLO>Title</TITOLO>");
            expect(mockReq.body.noappendchat).toBe(true);
        });

        it("should handle missing url error", async () => {
            mockReq.body = {}; // Missing url
            mockHandlerService.getDataByResponseHttp.mockImplementation(async (req: any, ctx: any, ip: any, preprocessor: any) => {
                await preprocessor(req); // This will throw ValidationError
                return { systemPrompt: "sys", resultData: {} };
            });
            await controller.handleClickbaitRequest(
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

    describe("handleCheshireRequest", () => {
        it("should handle cheshire request", async () => {
            mockReq.body = { text: "dirty-text" };
            mockHandlerService.getDataByResponseHttp.mockImplementation(async (req: any, ctx: any, ip: any, preprocessor: any) => {
                await preprocessor(req);
                return { systemPrompt: "sys", resultData: {} };
            });
            mockHandlerService.handleLLM.mockResolvedValue({});

            await controller.handleCheshireRequest(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                LLMProvider.OpenAICloud
            );

            expect(mockReq.body.text).toBe("clean-text");
            expect(mockReq.body.noappendchat).toBe(true);
        });

        it("should handle missing text error", async () => {
            mockReq.body = {}; // Missing text
            mockHandlerService.getDataByResponseHttp.mockImplementation(async (req: any, ctx: any, ip: any, preprocessor: any) => {
                await preprocessor(req); // This will throw ValidationError
                return { systemPrompt: "sys", resultData: {} };
            });
            await controller.handleCheshireRequest(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                LLMProvider.OpenAICloud
            );
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    message: expect.stringContaining("'text' mancante"),
                    fields: expect.objectContaining({ text: "Required" })
                })
            );
        });
    });

    describe("handleAnalisiCommentiRequest", () => {
        it("should handle analisi commenti request", async () => {
            mockReq.body = { payload: [{ text: "comment" }] };
            mockHandlerService.getDataByResponseHttp.mockImplementation(async (req: any, ctx: any, ip: any, preprocessor: any) => {
                await preprocessor(req);
                return { systemPrompt: "sys", resultData: {} };
            });
            mockHandlerService.handleLLM.mockResolvedValue({});

            await controller.handleAnalisiCommentiRequest(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                LLMProvider.OpenAICloud
            );

            expect(mockReq.body.question).toBe("formatted-comments");
            expect(mockReq.body.noappendchat).toBe(true);
        });

        it("should handle missing payload error", async () => {
            mockReq.body = {}; // Missing payload
            mockHandlerService.getDataByResponseHttp.mockImplementation(async (req: any, ctx: any, ip: any, preprocessor: any) => {
                await preprocessor(req); // This will throw ValidationError
                return { systemPrompt: "sys", resultData: {} };
            });
            await controller.handleAnalisiCommentiRequest(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                LLMProvider.OpenAICloud
            );
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    message: expect.stringContaining("Payload commenti mancante"),
                    fields: expect.objectContaining({ payload: "Required" })
                })
            );
        });
    });
});
