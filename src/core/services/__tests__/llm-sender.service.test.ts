import "reflect-metadata";
import { container } from "tsyringe";
import { LLMSenderService } from "../llm-sender.service.js";
import { LLMChainService } from "../llm-chain.service.js";
import { LLMAgentService } from "../llm-agent.service.js";
import { LOGGER_TOKEN } from "../../di/tokens.js";
import { Logger } from "winston";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ConfigChainPrompt } from "../../interfaces/protocol/configchainprompt.interface.js";
import { LLMProvider } from "../../enums/llmprovider.enum.js";

// Mock external dependencies to prevent ESM/CJS issues
jest.mock("@langchain/openai", () => ({
    AzureChatOpenAI: jest.fn(),
    ChatOpenAI: jest.fn(),
}));
jest.mock("@langchain/anthropic", () => ({
    ChatAnthropic: jest.fn(),
}));
jest.mock("@langchain/google-genai", () => ({
    ChatGoogleGenerativeAI: jest.fn(),
}));
jest.mock("@langchain/ollama", () => ({
    ChatOllama: jest.fn(),
    Ollama: jest.fn(),
}));

// Mock langchain core and graph dependencies
jest.mock("langchain", () => ({
    AgentMiddleware: jest.fn(),
    createAgent: jest.fn(),
    ReactAgent: jest.fn(),
    StructuredTool: jest.fn(),
    Tool: jest.fn(),
}));

jest.mock("@langchain/langgraph", () => ({
    BaseCheckpointSaver: jest.fn(),
    MemorySaver: jest.fn(),
}));

// Mock dependencies
jest.mock("@langchain/core/runnables", () => ({
    RunnableSequence: {
        from: jest.fn().mockReturnValue({
            invoke: jest.fn(),
        }),
    },
}));
jest.mock("@langchain/core/output_parsers", () => ({
    StringOutputParser: jest.fn(),
}));
jest.mock("@langchain/core/prompts", () => ({
    ChatPromptTemplate: jest.fn(),
}));

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
} as unknown as Logger;

const mockLLMChainService = {
    getInstanceLLM: jest.fn().mockReturnValue("mock-llm-instance"),
} as unknown as LLMChainService;

const mockLLMAgentService = {
    getAgent: jest.fn().mockReturnValue("mock-agent"),
    invokeAgent: jest.fn().mockResolvedValue("agent-response"),
} as unknown as LLMAgentService;

describe("LLMSenderService", () => {
    let service: LLMSenderService;

    beforeEach(() => {
        container.registerInstance(LOGGER_TOKEN, mockLogger);
        container.registerInstance(LLMChainService, mockLLMChainService);
        container.registerInstance(LLMAgentService, mockLLMAgentService);
        service = container.resolve(LLMSenderService);
        jest.clearAllMocks();
    });

    afterEach(() => {
        container.reset();
    });

    const mockConfig: ConfigChainPrompt = {
        provider: LLMProvider.OpenAICloud,
        modelname: "gpt-4",
        temperature: 0.7,
        maxTokens: 100,
        numCtx: 2048,
    };

    const mockDataRequest = {
        question: "test question",
        keyconversation: "session-123",
        config: mockConfig,
    };

    const mockPromptTemplate = {} as ChatPromptTemplate<any, any>;

    describe("senderToLLM", () => {
        it("should send request to LLM and return answer", async () => {
            const mockChain = {
                invoke: jest.fn().mockResolvedValue("llm-answer"),
            };
            (RunnableSequence.from as jest.Mock).mockReturnValue(mockChain);

            const result = await service.senderToLLM(
                mockDataRequest as any,
                "system prompt",
                mockPromptTemplate
            );

            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining("System prompt contestuale"));
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining("Question prompt utente"));
            expect(mockLLMChainService.getInstanceLLM).toHaveBeenCalledWith(mockConfig);
            expect(mockChain.invoke).toHaveBeenCalledWith(
                { input: "test question" },
                { configurable: { sessionId: "session-123" } }
            );
            expect(result).toBe("llm-answer");
        });

        it("should use provided chainWithHistory if available", async () => {
            const mockChainWithHistory = {
                invoke: jest.fn().mockResolvedValue("history-answer"),
            };

            const result = await service.senderToLLM(
                mockDataRequest as any,
                "system prompt",
                mockPromptTemplate,
                mockChainWithHistory as any
            );

            expect(mockChainWithHistory.invoke).toHaveBeenCalled();
            expect(result).toBe("history-answer");
        });
    });

    describe("getChain", () => {
        it("should create a runnable sequence", () => {
            const result = service.getChain("llm" as any, mockPromptTemplate);
            expect(RunnableSequence.from).toHaveBeenCalledWith([
                mockPromptTemplate,
                "llm",
                expect.any(StringOutputParser),
            ]);
            expect(result).toBeDefined();
        });
    });

    describe("invokeChain", () => {
        it("should invoke chain and return answer", async () => {
            const mockChain = {
                invoke: jest.fn().mockResolvedValue("answer"),
            };
            const result = await service.invokeChain("question" as any, "session-id", mockChain as any);
            expect(mockChain.invoke).toHaveBeenCalledWith(
                { input: "question" },
                { configurable: { sessionId: "session-id" } }
            );
            expect(result).toBe("answer");
        });

        it("should handle errors and log them", async () => {
            const error = new Error("Test error");
            const mockChain = {
                invoke: jest.fn().mockRejectedValue(error),
            };

            await expect(service.invokeChain("question" as any, "session-id", mockChain as any))
                .rejects.toThrow("Errore invokeChain: Test error");

            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining("Errore durante l'invocazione"), error);
        });

        it("should handle rate limit errors specifically", async () => {
            const error = new Error("rate limit exceeded");
            const mockChain = {
                invoke: jest.fn().mockRejectedValue(error),
            };

            await expect(service.invokeChain("question" as any, "session-id", mockChain as any))
                .rejects.toThrow();

            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining("Rate limit superata"));
        });
    });

    describe("senderToAgent", () => {
        it("should delegate to LLMAgentService", async () => {
            const result = await service.senderToAgent(
                "question",
                "session-id",
                mockConfig,
                "system prompt",
                [],
                [],
                "agent-name"
            );

            expect(mockLLMChainService.getInstanceLLM).toHaveBeenCalledWith(mockConfig);
            expect(mockLLMAgentService.getAgent).toHaveBeenCalledWith(
                "mock-llm-instance",
                "system prompt",
                [],
                [],
                "agent-name"
            );
            expect(mockLLMAgentService.invokeAgent).toHaveBeenCalledWith(
                "mock-agent",
                "question",
                "session-id"
            );
            expect(result).toBe("agent-response");
        });
    });
});
