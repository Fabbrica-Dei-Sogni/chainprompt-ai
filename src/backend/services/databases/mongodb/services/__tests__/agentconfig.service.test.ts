import { AgentConfigService } from '../agentconfig.service.js';
import { AgentConfig } from '../../models/agentconfig.schema.js';
import { promptFrameworkService } from '../promptframework.service.js';

// Mock dependencies
jest.mock('../../models/agentconfig.schema.js');
jest.mock('../promptframework.service.js', () => ({
    promptFrameworkService: {
        findById: jest.fn()
    }
}));

describe('AgentConfigService', () => {
    let service: AgentConfigService;
    let mockModel: any;

    beforeEach(() => {
        jest.clearAllMocks();

        const mockQuery = {
            exec: jest.fn(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis()
        };

        // Setup mock model
        mockModel = {
            find: jest.fn().mockReturnValue(mockQuery),
            findOne: jest.fn().mockReturnValue(mockQuery),
            findById: jest.fn().mockReturnValue(mockQuery),
            create: jest.fn(),
            findByIdAndUpdate: jest.fn().mockReturnValue(mockQuery),
            findByIdAndDelete: jest.fn().mockReturnValue(mockQuery),
            mockQuery // expose for assertions
        };

        // Mock the AgentConfig model methods directly
        (AgentConfig.find as jest.Mock) = mockModel.find;
        (AgentConfig.findOne as jest.Mock) = mockModel.findOne;
        (AgentConfig.findById as jest.Mock) = mockModel.findById;
        (AgentConfig.create as jest.Mock) = mockModel.create;
        (AgentConfig.findByIdAndUpdate as jest.Mock) = mockModel.findByIdAndUpdate;
        (AgentConfig.findByIdAndDelete as jest.Mock) = mockModel.findByIdAndDelete;

        // Since AgentConfigService passes AgentConfig to super, we need to make sure
        // the instance methods are available on the prototype or the mock itself
        // However, SchemaService uses the model passed in constructor.
        // We can try to instantiate the service.
        // But wait, AgentConfig is a Value/Class, not an instance.
        // In mongoose, model methods are static.

        // Let's re-instantiate service for each test to ensure clean state if needed,
        // but here it's a singleton export.
        // The export is `export const agentConfigService = new AgentConfigService();`
        // So we are testing the exported instance, but we can also instantiate the class if we export it.
        // The class IS exported.

        service = new AgentConfigService();
        // We need to inject the mock model into the service instance because it's protected.
        // Or better, since we mocked AgentConfig which is passed to super(), 
        // and super() assigns it to this.model, we need AgentConfig to behave like a model.

        // A better approach for mongoose models mocking:
        // The service calls `this.model.findOne(...)`. `this.model` is `AgentConfig`.
        // So mocking AgentConfig methods should work.
    });

    describe('findByContesto', () => {
        it('should find agent by contesto', async () => {
            const mockAgent = { contesto: 'test' };
            mockModel.mockQuery.exec.mockResolvedValue(mockAgent);

            const result = await service.findByContesto('test');

            expect(mockModel.findOne).toHaveBeenCalledWith({ contesto: 'test' });
            expect(mockModel.mockQuery.exec).toHaveBeenCalled();
            expect(result).toEqual(mockAgent);
        });
    });

    describe('createAgentConfig', () => {
        it('should create agent config', async () => {
            const mockData = {
                nome: 'test',
                contesto: 'ctx',
                promptFrameworkRef: 'ref',
                profilo: 'prof'
            };
            const mockCreated = { ...mockData, _id: '123' };
            mockModel.create.mockResolvedValue(mockCreated);

            const result = await service.createAgentConfig(mockData as any);

            expect(mockModel.create).toHaveBeenCalledWith(expect.objectContaining({
                nome: 'test',
                contesto: 'ctx'
            }));
            expect(result).toEqual(mockCreated);
        });
    });

    describe('getFinalPrompt', () => {
        it('should return prompt from framework', async () => {
            const mockAgent = { promptFrameworkRef: 'ref' };
            const mockTemplate = {
                sections: [
                    { key: 's1', content: 'c1', order: 1 },
                    { key: 's2', content: 'c2', order: 2 }
                ]
            };
            (promptFrameworkService.findById as jest.Mock).mockResolvedValue(mockTemplate);

            const result = await service.getFinalPrompt(mockAgent as any);

            expect(promptFrameworkService.findById).toHaveBeenCalledWith('ref');
            expect(result).toContain('s1: c1');
            expect(result).toContain('s2: c2');
        });

        it('should return fallback if no template found', async () => {
            const mockAgent = { promptFrameworkRef: 'ref' };
            (promptFrameworkService.findById as jest.Mock).mockResolvedValue(null);

            const result = await service.getFinalPrompt(mockAgent as any);

            expect(result).toBe('nessun prompt trovato');
        });
    });

    describe('getPromptBySections', () => {
        it('should return prompt for specific sections', async () => {
            const mockAgent = { promptFrameworkRef: 'ref' };
            const mockTemplate = {
                sections: [
                    { key: 's1', content: 'c1' },
                    { key: 's2', content: 'c2' }
                ]
            };
            (promptFrameworkService.findById as jest.Mock).mockResolvedValue(mockTemplate);

            const result = await service.getPromptBySections(mockAgent as any, ['s1']);

            expect(result).toContain('s1: c1');
            expect(result).not.toContain('s2: c2');
        });
    });

    describe('getAgentWithTemplate', () => {
        it('should return agent and template', async () => {
            const mockAgent = { _id: '123', promptFrameworkRef: 'ref' };
            const mockTemplate = { _id: 'ref' };

            mockModel.mockQuery.exec.mockResolvedValue(mockAgent);
            (promptFrameworkService.findById as jest.Mock).mockResolvedValue(mockTemplate);

            const result = await service.getAgentWithTemplate('123');

            expect(mockModel.findById).toHaveBeenCalledWith('123');
            expect(promptFrameworkService.findById).toHaveBeenCalledWith('ref');
            expect(result).toEqual({ agent: mockAgent, template: mockTemplate });
        });

        it('should throw if agent not found', async () => {
            mockModel.mockQuery.exec.mockResolvedValue(null);

            await expect(service.getAgentWithTemplate('123'))
                .rejects.toThrow('Agent not found');
        });
    });
});
