import "reflect-metadata";
import { container } from "tsyringe";
import { MiddlewareService } from "../middleware.service.js";
import { LOGGER_TOKEN } from "../../../../../core/di/tokens.js";
import { createMiddleware, summarizationMiddleware } from "langchain";

// Mock langchain
jest.mock("langchain", () => ({
    createMiddleware: jest.fn(),
    summarizationMiddleware: jest.fn(),
    ToolMessage: jest.fn()
}));

describe("MiddlewareService", () => {
    let service: MiddlewareService;
    let mockLogger: any;

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

        service = new MiddlewareService(mockLogger);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("handleToolErrors", () => {
        it("should be created via createMiddleware", () => {
            expect(createMiddleware).toHaveBeenCalledWith(expect.objectContaining({
                name: "HandleToolErrors",
                wrapToolCall: expect.any(Function)
            }));
        });
    });

    describe("createSummaryMemoryMiddleware", () => {
        it("should create summarization middleware", () => {
            const modelname = "test-model";
            const mockMiddleware = {};
            (summarizationMiddleware as jest.Mock).mockReturnValue(mockMiddleware);

            const result = service.createSummaryMemoryMiddleware(modelname);

            expect(result).toBe(mockMiddleware);
            expect(summarizationMiddleware).toHaveBeenCalledWith({
                model: modelname,
                trigger: { tokens: 4000 },
                keep: { messages: 20 }
            });
            expect(mockLogger.info).toHaveBeenCalled();
        });
    });
});
