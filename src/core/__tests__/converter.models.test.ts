import "reflect-metadata";
import { container } from "tsyringe";
import { ConverterModels } from "../converter.models.js";
import { LOGGER_TOKEN } from "../di/tokens.js";
import { Logger } from "winston";
import { LLMProvider } from "../enums/llmprovider.enum.js";
import { EmbeddingProvider } from "../enums/embeddingprovider.enum.js";

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
} as unknown as Logger;

describe("ConverterModels", () => {
    let service: ConverterModels;

    beforeEach(() => {
        container.registerInstance(LOGGER_TOKEN, mockLogger);
        service = container.resolve(ConverterModels);
        jest.clearAllMocks();
    });

    afterEach(() => {
        container.reset();
    });

    describe("getAgentContent", () => {
        it("should extract content from agent result", () => {
            const agentResult = {
                messages: [
                    { type: "human", content: "question" },
                    { type: "ai", content: "answer", usage_metadata: { tokens: 10 } },
                ],
            };
            const result = service.getAgentContent(agentResult);
            expect(result).toBe("answer");
        });

        it("should return empty string if no ai message found", () => {
            const agentResult = {
                messages: [
                    { type: "human", content: "question" },
                ],
            };
            const result = service.getAgentContent(agentResult);
            expect(result).toBe("");
        });

        it("should handle missing messages array", () => {
            const agentResult = {};
            const result = service.getAgentContent(agentResult);
            expect(result).toBe("");
        });
    });

    describe("getDataRequest", () => {
        it("should parse request body and return DataRequest", () => {
            const body = {
                question: "test question",
                provider: LLMProvider.OpenAICloud,
                modelname: "gpt-4",
                temperature: 0.5,
                sessionchat: "session-1",
                maxTokens: 100,
                numCtx: 200,
                noappendchat: true,
                timeout: 5000,
            };
            const result = service.getDataRequest(body as any, "context", "id", false);

            expect(result.question).toBe("test question");
            expect(result.keyconversation).toBe("session-1_id_context_chat");
            expect(result.config.provider).toBe(LLMProvider.OpenAICloud);
            expect(result.config.modelname).toBe("gpt-4");
            expect(result.config.temperature).toBe(0.5);
            expect(result.config.maxTokens).toBe(100);
            expect(result.config.numCtx).toBe(200);
            expect(result.config.timeout).toBe(5000);
            expect(result.noappendchat).toBe(true);

            expect(mockLogger.info).toHaveBeenCalled();
        });

        it("should use defaults when body fields are missing", () => {
            const body = { text: "text question" }; // using text instead of question
            const result = service.getDataRequest(body as any, "context", "id", true);

            expect(result.question).toBe("text question");
            expect(result.keyconversation).toContain("_agent");
            expect(result.config.provider).toBe(LLMProvider.ChatOllama); // default
            expect(result.config.maxTokens).toBe(8032); // default
        });
    });

    describe("getDataRequestDFL", () => {
        it("should return default DataRequest", () => {
            const result = service.getDataRequestDFL();
            expect(result.question).toBe("Quale è la risposta ?");
            expect(result.config.modelname).toBe("qwen3:0.6b");
            expect(result.config.temperature).toBe(0.1);
        });
    });

    describe("getConfigEmbeddingsDFL", () => {
        it("should return default ConfigEmbeddings", () => {
            process.env.URI_LANGCHAIN_OLLAMA = "http://test-ollama";
            const result = service.getConfigEmbeddingsDFL();
            expect(result.modelname).toBe("mxbai-embed-large");
            expect(result.provider).toBe(EmbeddingProvider.Ollama);
            expect(result.baseUrl).toBe("http://test-ollama");
        });
    });
});
