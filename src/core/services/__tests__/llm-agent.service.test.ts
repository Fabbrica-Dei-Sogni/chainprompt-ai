import "reflect-metadata";
import { container } from "tsyringe";
import { LLMAgentService } from "../llm-agent.service.js";
import { LOGGER_TOKEN } from "../../di/tokens.js";
import { Logger } from "winston";
import { createAgent } from "langchain";
import { Runnable } from "@langchain/core/runnables";

// Mock langchain
jest.mock("langchain", () => ({
    createAgent: jest.fn(),
}));

// Mock Logger
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
} as unknown as Logger;

describe("LLMAgentService", () => {
    let service: LLMAgentService;

    beforeEach(() => {
        container.registerInstance(LOGGER_TOKEN, mockLogger);
        service = container.resolve(LLMAgentService);
        jest.clearAllMocks();
    });

    afterEach(() => {
        container.reset();
    });

    describe("getAgent", () => {
        it("should create an agent with default parameters", () => {
            const mockLLM = {} as Runnable;
            const mockSystemPrompt = "test prompt";
            (createAgent as jest.Mock).mockReturnValue({});

            const agent = service.getAgent(mockLLM, mockSystemPrompt, [], []);

            expect(createAgent).toHaveBeenCalledWith(expect.objectContaining({
                model: mockLLM,
                systemPrompt: mockSystemPrompt,
                name: "generico",
            }));
            expect(agent).toBeDefined();
        });

        it("should create an agent with custom parameters", () => {
            const mockLLM = {} as Runnable;
            const mockSystemPrompt = "test prompt";
            const mockTools: any[] = [];
            const mockMiddleware: any[] = [];
            const mockName = "TestAgent";

            (createAgent as jest.Mock).mockReturnValue({});

            service.getAgent(mockLLM, mockSystemPrompt, mockTools, mockMiddleware, mockName);

            expect(createAgent).toHaveBeenCalledWith(expect.objectContaining({
                name: mockName,
                tools: mockTools,
                middleware: mockMiddleware,
            }));
        });
    });

    describe("invokeAgent", () => {
        it("should invoke the agent and log complex state", async () => {
            const mockResult = { output: "response" };
            const mockState = {
                createdAt: new Date(),
                values: { key: "value" },
                next: ["node1"],
                config: { configurable: { checkpoint_id: "chk-1" } },
                metadata: { source: "test" },
                tasks: [{ id: "task1" }],
                parentConfig: { configurable: { thread_id: "parent-1" } }
            };

            const mockAgent = {
                invoke: jest.fn().mockResolvedValue(mockResult),
                graph: {
                    getName: jest.fn().mockReturnValue("TestGraph"),
                    getState: jest.fn().mockResolvedValue(mockState)
                }
            };

            const question = "hello";
            const sessionId = "123";

            const result = await service.invokeAgent(mockAgent as any, question, sessionId);

            expect(mockAgent.invoke).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining("Next nodes to execute:"));
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining("Pending tasks:"));
            expect(result).toBe(mockResult);
        });

        it("should handle empty state values during logging", async () => {
            const mockResult = { output: "response" };
            const mockState = {
                createdAt: new Date(),
                // Missing values, next, tasks etc to trigger early returns
            };

            const mockAgent = {
                invoke: jest.fn().mockResolvedValue(mockResult),
                graph: {
                    getName: jest.fn().mockReturnValue("TestGraph"),
                    getState: jest.fn().mockResolvedValue(mockState)
                }
            };

            await service.invokeAgent(mockAgent as any, "question", "session");

            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining("Nessun valore presente"));
        });

        it("should handle errors during invocation", async () => {
            const mockError = new Error("Invocation failed");
            const mockAgent = {
                invoke: jest.fn().mockRejectedValue(mockError),
                graph: {
                    getName: jest.fn().mockReturnValue("TestGraph")
                }
            };

            await expect(service.invokeAgent(mockAgent as any, "question", "session"))
                .rejects
                .toEqual(expect.objectContaining({
                    error: true,
                    message: expect.stringContaining("Si è verificato un errore"),
                    details: "Invocation failed"
                }));

            expect(mockLogger.error).toHaveBeenCalledWith("Errore durante l'invocazione dell'agente:", mockError);
        });
    });
});
