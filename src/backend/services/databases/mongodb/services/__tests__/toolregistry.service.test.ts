import { ToolConfigService } from '../toolregistry.service.js';
import { ToolRegistry } from '../../models/toolregistry.schema.js';
import { AgentConfig } from '../../models/agentconfig.schema.js';

// Mock dependencies
jest.mock('../../models/toolregistry.schema.js');
jest.mock('../../models/agentconfig.schema.js');

describe('ToolConfigService', () => {
    let service: ToolConfigService;
    let mockToolModel: any;
    let mockAgentModel: any;

    beforeEach(() => {
        jest.clearAllMocks();

        const mockQuery = {
            exec: jest.fn(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis()
        };

        // Setup mock models
        mockToolModel = {
            find: jest.fn().mockReturnValue(mockQuery),
            findOne: jest.fn().mockReturnValue(mockQuery),
            findById: jest.fn().mockReturnValue(mockQuery),
            create: jest.fn(),
            findByIdAndUpdate: jest.fn().mockReturnValue(mockQuery),
            findByIdAndDelete: jest.fn().mockReturnValue(mockQuery),
            mockQuery // expose for assertions
        };

        mockAgentModel = {
            findById: jest.fn().mockReturnValue(mockQuery),
            mockQuery
        };

        // Mock the models directly
        (ToolRegistry.find as jest.Mock) = mockToolModel.find;
        (ToolRegistry.findOne as jest.Mock) = mockToolModel.findOne;
        (ToolRegistry.findById as jest.Mock) = mockToolModel.findById;
        (ToolRegistry.create as jest.Mock) = mockToolModel.create;
        (ToolRegistry.findByIdAndUpdate as jest.Mock) = mockToolModel.findByIdAndUpdate;
        (ToolRegistry.findByIdAndDelete as jest.Mock) = mockToolModel.findByIdAndDelete;

        (AgentConfig.findById as jest.Mock) = mockAgentModel.findById;

        service = new ToolConfigService();
    });

    describe('getAgentTools', () => {
        it('should return loaded tools for agent', async () => {
            const mockAgent = { tools: ['tool1'] };
            const mockToolDoc = { name: 'tool1', modulePath: 'path/to/tool', enabled: true };

            // Mock AgentConfig.findById
            mockAgentModel.mockQuery.exec.mockResolvedValueOnce(mockAgent);

            // Mock ToolRegistry.find
            mockToolModel.mockQuery.exec.mockResolvedValueOnce([mockToolDoc]);

            // Mock dynamic import
            // Since we cannot easily mock dynamic import in Jest without babel plugins or complex setups,
            // we can try to spy on the global import or just mock the module resolution if possible.
            // However, the service uses `await import(tool.modulePath)`.
            // We can mock the module path if it's a real path, or we can try to mock the `import()` function if environment allows.
            // A simpler way is to mock the module that is being imported if we know it.
            // But here the path comes from DB.
            // Let's try to mock a specific path and use that in the test.

            // Jest doesn't support mocking dynamic imports easily.
            // We might need to skip the actual import part or mock the implementation of getAgentTools if we only want to test logic around DB calls.
            // But we want to test the whole flow.

            // Workaround: Mock the `import` by using `jest.mock` for a virtual module and use that path.
            const virtualModulePath = 'virtual-tool-module';
            jest.mock('virtual-tool-module', () => ({ __esModule: true, default: { name: 'loadedTool' } }), { virtual: true });

            mockToolDoc.modulePath = virtualModulePath;

            const result = await service.getAgentTools('agent1');

            expect(AgentConfig.findById).toHaveBeenCalledWith('agent1');
            expect(ToolRegistry.find).toHaveBeenCalledWith({
                name: { $in: ['tool1'] },
                enabled: true
            });
            // The service returns module.default || module.
            // Our mock returns { default: { name: 'loadedTool' } }.
            // So result should be { name: 'loadedTool' }.
            expect(result).toEqual([{ name: 'loadedTool' }]);
        });

        it('should return empty array if agent not found', async () => {
            mockAgentModel.mockQuery.exec.mockResolvedValueOnce(null);

            const result = await service.getAgentTools('agent1');

            expect(result).toEqual([]);
        });

        it('should return empty array if agent has no tools', async () => {
            mockAgentModel.mockQuery.exec.mockResolvedValueOnce({ tools: [] });
            // Also mock ToolRegistry.find to return empty array
            mockToolModel.mockQuery.exec.mockResolvedValueOnce([]);

            const result = await service.getAgentTools('agent1');

            expect(result).toEqual([]);
        });
    });
});
