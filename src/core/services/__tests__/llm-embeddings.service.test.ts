import "reflect-metadata";
import { container } from "tsyringe";
import { LLMEmbeddingsService } from "../llm-embeddings.service.js";
import { EmbeddingProvider } from "../../enums/embeddingprovider.enum.js";
import { ConfigEmbeddings } from "../../interfaces/protocol/configembeddings.interface.js";
import { OpenAIEmbeddings, AzureOpenAIEmbeddings } from "@langchain/openai";
import { OllamaEmbeddings } from "@langchain/ollama";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { VertexAIEmbeddings } from "@langchain/google-vertexai";
import { CacheBackedEmbeddings } from "@langchain/classic/embeddings/cache_backed";

// Mock external dependencies
jest.mock("@langchain/openai", () => ({
    OpenAIEmbeddings: jest.fn(),
    AzureOpenAIEmbeddings: jest.fn(),
}));
jest.mock("@langchain/ollama", () => ({
    OllamaEmbeddings: jest.fn(),
}));
jest.mock("@langchain/community/embeddings/hf", () => ({
    HuggingFaceInferenceEmbeddings: jest.fn(),
}));
jest.mock("@langchain/community/embeddings/huggingface_transformers", () => ({
    HuggingFaceTransformersEmbeddings: jest.fn(),
}));
jest.mock("@langchain/google-vertexai", () => ({
    VertexAIEmbeddings: jest.fn(),
}));
jest.mock("@langchain/classic/embeddings/cache_backed", () => ({
    CacheBackedEmbeddings: {
        fromBytesStore: jest.fn().mockReturnValue("cached-instance"),
    },
}));

describe("LLMEmbeddingsService", () => {
    let service: LLMEmbeddingsService;

    beforeEach(() => {
        service = container.resolve(LLMEmbeddingsService);
        jest.clearAllMocks();
        process.env.OPENAI_API_KEY = "test-openai-key";
        process.env.AZURE_OPENAI_API_KEY = "test-azure-key";
        process.env.URI_LANGCHAIN_OLLAMA = "http://localhost:11434";
        process.env.HUGGINGFACEHUB_API_TOKEN = "test-hf-token";
    });

    afterEach(() => {
        container.reset();
    });

    const baseConfig: ConfigEmbeddings = {
        provider: EmbeddingProvider.OpenAI,
        modelname: "text-embedding-3-small",
        dimension: 1536,
    };

    it("should return cached OpenAIEmbeddings instance", () => {
        const config = { ...baseConfig, provider: EmbeddingProvider.OpenAI };
        const result = service.getInstanceEmbeddings(config);

        expect(OpenAIEmbeddings).toHaveBeenCalledWith(expect.objectContaining({
            model: config.modelname,
            apiKey: "test-openai-key",
        }));
        expect(CacheBackedEmbeddings.fromBytesStore).toHaveBeenCalled();
        expect(result).toBe("cached-instance");
    });

    it("should return AzureOpenAIEmbeddings instance", () => {
        const config = { ...baseConfig, provider: EmbeddingProvider.AzureOpenAI };
        service.getInstanceEmbeddings(config);
        expect(AzureOpenAIEmbeddings).toHaveBeenCalledWith(expect.objectContaining({
            model: config.modelname,
            apiKey: "test-azure-key",
        }));
    });

    it("should return OllamaEmbeddings instance", () => {
        const config = { ...baseConfig, provider: EmbeddingProvider.Ollama };
        service.getInstanceEmbeddings(config);
        expect(OllamaEmbeddings).toHaveBeenCalledWith(expect.objectContaining({
            model: config.modelname,
            baseUrl: "http://localhost:11434",
        }));
    });

    it("should return HuggingFaceInferenceEmbeddings instance", () => {
        const config = { ...baseConfig, provider: EmbeddingProvider.HuggingFace };
        service.getInstanceEmbeddings(config);
        expect(HuggingFaceInferenceEmbeddings).toHaveBeenCalledWith(expect.objectContaining({
            model: config.modelname,
            apiKey: "test-hf-token",
        }));
    });

    it("should return HuggingFaceTransformersEmbeddings instance", () => {
        const config = { ...baseConfig, provider: EmbeddingProvider.HuggingFaceLocal };
        service.getInstanceEmbeddings(config);
        expect(HuggingFaceTransformersEmbeddings).toHaveBeenCalledWith(expect.objectContaining({
            model: config.modelname,
        }));
    });

    it("should return VertexAIEmbeddings instance", () => {
        const config = { ...baseConfig, provider: EmbeddingProvider.GoogleVertexAI };
        service.getInstanceEmbeddings(config);
        expect(VertexAIEmbeddings).toHaveBeenCalledWith(expect.objectContaining({
            model: config.modelname,
        }));
    });

    it("should throw error for unsupported provider", () => {
        const config = { ...baseConfig, provider: "Unknown" as EmbeddingProvider };
        expect(() => service.getInstanceEmbeddings(config)).toThrow("Provider embedding non supportato");
    });
});
