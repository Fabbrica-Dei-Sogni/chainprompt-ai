import "reflect-metadata";
import { container } from "tsyringe";
import { ReaderPromptService } from "../reader-prompt.service.js";
import { LOGGER_TOKEN } from "../../../../core/di/tokens.js";

// Mock dependencies
jest.mock("../../common.service.js", () => ({
    contextFolder: "mock-context-folder"
}));
jest.mock("../../databases/mongodb/services/agentconfig.service.js", () => ({
    agentConfigService: {
        findByContesto: jest.fn(),
        getFinalPrompt: jest.fn(),
        getPromptBySection: jest.fn()
    }
}));
jest.mock("../../filesystem.service.js", () => ({
    readFileAndConcat: jest.fn()
}));
jest.mock("../../../logger.backend.js", () => ({})); // Mock side-effect import

describe("ReaderPromptService", () => {
    let service: ReaderPromptService;
    let mockLogger: any;

    // External mocks
    const { agentConfigService } = require("../../databases/mongodb/services/agentconfig.service.js");
    const { readFileAndConcat } = require("../../filesystem.service.js");

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

        service = new ReaderPromptService(mockLogger);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getFrameworkPrompts", () => {
        it("should return prompt from MongoDB if available", async () => {
            const context = "test-context";
            const mockConfig = { name: "test-agent" };
            const mockPrompt = "mongo-prompt";

            agentConfigService.findByContesto.mockResolvedValue(mockConfig);
            agentConfigService.getFinalPrompt.mockReturnValue(mockPrompt);

            const result = await service.getFrameworkPrompts(context);

            expect(result).toBe(mockPrompt);
            expect(agentConfigService.findByContesto).toHaveBeenCalledWith(context);
            expect(readFileAndConcat).not.toHaveBeenCalled();
        });

        it("should fallback to filesystem if not found in MongoDB", async () => {
            const context = "test-context";
            const mockPrompt = "fs-prompt";

            agentConfigService.findByContesto.mockResolvedValue(null);
            (readFileAndConcat as jest.Mock).mockResolvedValue(mockPrompt);

            const result = await service.getFrameworkPrompts(context);

            expect(result).toBe(mockPrompt);
            expect(agentConfigService.findByContesto).toHaveBeenCalledWith(context);
            expect(readFileAndConcat).toHaveBeenCalledWith(
                ['prompt.ruolo', 'prompt.obiettivo', 'prompt.azione', 'prompt.contesto'],
                "mock-context-folder/" + context
            );
        });
    });

    describe("getSectionsPrompts", () => {
        it("should read specific section from filesystem", async () => {
            const context = "test-context";
            const section = "prompt.ruolo";
            const mockContent = "role-content";

            (readFileAndConcat as jest.Mock).mockResolvedValue(mockContent);

            const result = await service.getSectionsPrompts(context, section);

            expect(result).toBe(mockContent);
            expect(readFileAndConcat).toHaveBeenCalledWith([section], "mock-context-folder/" + context);
        });
    });

    describe("loadFrameworkPrompts", () => {
        it("should return null if config not found", async () => {
            agentConfigService.findByContesto.mockResolvedValue(null);
            const result = await service.loadFrameworkPrompts("unknown");
            expect(result).toBeNull();
        });
    });

    describe("loadSectionPrompt", () => {
        it("should return section prompt from config", async () => {
            const context = "test-context";
            const section = "role";
            const mockConfig = {};
            const mockSectionContent = "section-content";

            agentConfigService.findByContesto.mockResolvedValue(mockConfig);
            agentConfigService.getPromptBySection.mockReturnValue(mockSectionContent);

            const result = await service.loadSectionPrompt(context, section);

            expect(result).toBe(mockSectionContent);
            expect(agentConfigService.getPromptBySection).toHaveBeenCalledWith(mockConfig, section);
        });
    });
});
