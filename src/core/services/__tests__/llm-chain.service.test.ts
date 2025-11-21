import "reflect-metadata";
import { container } from "tsyringe";
import { LLMChainService } from "../llm-chain.service.js";
import { LLMProvider } from "../../enums/llmprovider.enum.js";
import { ConfigChainPrompt } from "../../interfaces/protocol/configchainprompt.interface.js";
import { AzureChatOpenAI, ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama, Ollama } from "@langchain/ollama";

// Mock external dependencies
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

describe("LLMChainService", () => {
    let service: LLMChainService;

    beforeEach(() => {
        service = container.resolve(LLMChainService);
        jest.clearAllMocks();
        process.env.OPENAI_API_KEY = "test-openai-key";
        process.env.ANTROPHIC_API_KEY = "test-anthropic-key";
        process.env.URI_LANGCHAIN_LLMSTUDIO = "http://localhost:1234";
        process.env.URI_LANGCHAIN_OLLAMA = "http://localhost:11434";
    });

    afterEach(() => {
        container.reset();
    });

    const baseConfig: ConfigChainPrompt = {
        provider: LLMProvider.OpenAICloud,
        modelname: "gpt-4",
        temperature: 0.7,
        maxTokens: 100,
        numCtx: 2048,
    };

    it("should return OpenAICloud instance", () => {
        const config = { ...baseConfig, provider: LLMProvider.OpenAICloud };
        service.getInstanceLLM(config);
        expect(ChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({
            modelName: config.modelname,
            apiKey: "test-openai-key",
        }));
    });

    it("should return OpenAILocal instance", () => {
        const config = { ...baseConfig, provider: LLMProvider.OpenAILocal };
        service.getInstanceLLM(config);
        expect(ChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({
            configuration: { baseURL: "http://localhost:1234" },
        }));
    });

    it("should return AzureOpenAICloud instance", () => {
        const config = { ...baseConfig, provider: LLMProvider.AzureOpenAiCloud };
        service.getInstanceLLM(config);
        expect(AzureChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({
            modelName: config.modelname,
        }));
    });

    it("should return Anthropic instance", () => {
        const config = { ...baseConfig, provider: LLMProvider.Anthropic };
        service.getInstanceLLM(config);
        expect(ChatAnthropic).toHaveBeenCalledWith(expect.objectContaining({
            modelName: config.modelname,
            apiKey: "test-anthropic-key",
        }));
    });

    it("should return Google instance", () => {
        const config = { ...baseConfig, provider: LLMProvider.Google };
        service.getInstanceLLM(config);
        expect(ChatGoogleGenerativeAI).toHaveBeenCalledWith(expect.objectContaining({
            model: config.modelname,
        }));
    });

    it("should return ChatOllama instance", () => {
        const config = { ...baseConfig, provider: LLMProvider.ChatOllama };
        service.getInstanceLLM(config);
        expect(ChatOllama).toHaveBeenCalledWith(expect.objectContaining({
            baseUrl: "http://localhost:11434",
            model: config.modelname,
        }));
    });

    it("should return Ollama instance", () => {
        const config = { ...baseConfig, provider: LLMProvider.Ollama };
        service.getInstanceLLM(config);
        expect(Ollama).toHaveBeenCalledWith(expect.objectContaining({
            baseUrl: "http://localhost:11434",
            model: config.modelname,
        }));
    });

    it("should throw error for unsupported provider", () => {
        const config = { ...baseConfig, provider: "Unknown" as LLMProvider };
        expect(() => service.getInstanceLLM(config)).toThrow("Provider non supportato");
    });
});
