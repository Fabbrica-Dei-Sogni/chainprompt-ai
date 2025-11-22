import { PromptFrameworkService } from '../promptframework.service.js';
import { PromptFramework } from '../../models/promptframework.schema.js';

// Mock dependencies
jest.mock('../../models/promptframework.schema.js');

describe('PromptFrameworkService', () => {
    let service: PromptFrameworkService;
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
            updateMany: jest.fn().mockReturnValue(mockQuery),
            mockQuery // expose for assertions
        };

        // Mock the PromptFramework model methods directly
        (PromptFramework.find as jest.Mock) = mockModel.find;
        (PromptFramework.findOne as jest.Mock) = mockModel.findOne;
        (PromptFramework.findById as jest.Mock) = mockModel.findById;
        (PromptFramework.create as jest.Mock) = mockModel.create;
        (PromptFramework.findByIdAndUpdate as jest.Mock) = mockModel.findByIdAndUpdate;
        (PromptFramework.findByIdAndDelete as jest.Mock) = mockModel.findByIdAndDelete;
        (PromptFramework.updateMany as jest.Mock) = mockModel.updateMany;

        service = new PromptFrameworkService();
    });

    describe('findActive', () => {
        it('should find active frameworks', async () => {
            const mockFrameworks = [{ name: 'fw1', isActive: true }];
            mockModel.mockQuery.exec.mockResolvedValue(mockFrameworks);

            const result = await service.findActive();

            expect(mockModel.find).toHaveBeenCalledWith({ isActive: true });
            expect(mockModel.mockQuery.exec).toHaveBeenCalled();
            expect(result).toEqual(mockFrameworks);
        });
    });

    describe('findDefault', () => {
        it('should find default framework', async () => {
            const mockFramework = { name: 'fw1', isDefault: true };
            mockModel.mockQuery.exec.mockResolvedValue(mockFramework);

            const result = await service.findDefault();

            expect(mockModel.findOne).toHaveBeenCalledWith({ isDefault: true });
            expect(result).toEqual(mockFramework);
        });
    });

    describe('findByName', () => {
        it('should find framework by name', async () => {
            const mockFramework = { name: 'fw1' };
            mockModel.mockQuery.exec.mockResolvedValue(mockFramework);

            const result = await service.findByName('fw1');

            expect(mockModel.findOne).toHaveBeenCalledWith({ name: 'fw1' });
            expect(result).toEqual(mockFramework);
        });
    });

    describe('setAsDefault', () => {
        it('should set framework as default and unset others', async () => {
            const mockFramework = { _id: '123', isDefault: true };
            mockModel.mockQuery.exec.mockResolvedValue(mockFramework);

            const result = await service.setAsDefault('123');

            expect(mockModel.updateMany).toHaveBeenCalledWith(
                { isDefault: true },
                { $set: { isDefault: false } }
            );
            expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('123', { isDefault: true }, { new: true });
            expect(result).toEqual(mockFramework);
        });
    });

    describe('addSection', () => {
        it('should add section to framework', async () => {
            const mockFramework = {
                _id: '123',
                sections: [],
                save: jest.fn().mockResolvedValue({ _id: '123', sections: [{ key: 's1' }] })
            };
            mockModel.mockQuery.exec.mockResolvedValue(mockFramework);

            const result = await service.addSection('123', { key: 's1', content: 'c1' });

            expect(mockModel.findById).toHaveBeenCalledWith('123');
            expect(mockFramework.sections).toHaveLength(1);
            expect(mockFramework.save).toHaveBeenCalled();
            expect(result?.sections).toHaveLength(1);
        });

        it('should return null if framework not found', async () => {
            mockModel.mockQuery.exec.mockResolvedValue(null);
            const result = await service.addSection('123', { key: 's1', content: 'c1' });
            expect(result).toBeNull();
        });
    });

    describe('updateSection', () => {
        it('should update existing section', async () => {
            const mockFramework = {
                _id: '123',
                sections: [{ key: 's1', content: 'old' }],
                save: jest.fn().mockResolvedValue({ _id: '123', sections: [{ key: 's1', content: 'new' }] })
            };
            mockModel.mockQuery.exec.mockResolvedValue(mockFramework);

            const result = await service.updateSection('123', 's1', { content: 'new' });

            expect(mockFramework.sections[0].content).toBe('new');
            expect(mockFramework.save).toHaveBeenCalled();
        });

        it('should return null if section not found', async () => {
            const mockFramework = { _id: '123', sections: [] };
            mockModel.mockQuery.exec.mockResolvedValue(mockFramework);

            const result = await service.updateSection('123', 's1', { content: 'new' });

            expect(result).toBeNull();
        });
    });

    describe('removeSection', () => {
        it('should remove section', async () => {
            const mockFramework = {
                _id: '123',
                sections: [{ key: 's1' }],
                save: jest.fn().mockResolvedValue({ _id: '123', sections: [] })
            };
            mockModel.mockQuery.exec.mockResolvedValue(mockFramework);

            const result = await service.removeSection('123', 's1');

            expect(mockFramework.sections).toHaveLength(0);
            expect(mockFramework.save).toHaveBeenCalled();
        });
    });

    describe('reorderSections', () => {
        it('should reorder sections', async () => {
            const mockFramework = {
                _id: '123',
                sections: [{ key: 's1' }, { key: 's2' }],
                save: jest.fn().mockImplementation(function (this: any) { return this; })
            };
            mockModel.mockQuery.exec.mockResolvedValue(mockFramework);

            const result = await service.reorderSections('123', ['s2', 's1']);

            expect(result?.sections[0].key).toBe('s2');
            expect(result?.sections[0].order).toBe(0);
            expect(result?.sections[1].key).toBe('s1');
            expect(result?.sections[1].order).toBe(1);
            expect(mockFramework.save).toHaveBeenCalled();
        });
    });

    describe('generatePrompt', () => {
        it('should generate prompt from sections', () => {
            const framework = {
                name: 'fw',
                sections: [
                    { key: 's1', content: 'c1', order: 1 },
                    { key: 's2', content: 'c2', order: 2 }
                ]
            };
            const result = service.generatePrompt(framework);
            expect(result).toContain('s1: c1');
            expect(result).toContain('s2: c2');
        });
    });

    describe('generatePromptBySections', () => {
        it('should generate prompt from specific sections', () => {
            const framework = {
                name: 'fw',
                sections: [
                    { key: 's1', content: 'c1' },
                    { key: 's2', content: 'c2' }
                ]
            };
            const result = service.generatePromptBySections(framework, ['s1']);
            expect(result).toContain('s1: c1');
            expect(result).not.toContain('s2: c2');
        });
    });

    describe('cloneFramework', () => {
        it('should clone framework', async () => {
            const original = {
                _id: '123',
                name: 'orig',
                sections: [{ key: 's1', content: 'c1' }]
            };
            mockModel.mockQuery.exec.mockResolvedValue(original);
            const cloned = { ...original, name: 'clone' };
            mockModel.create.mockResolvedValue(cloned);

            const result = await service.cloneFramework('123', 'clone');

            expect(mockModel.findById).toHaveBeenCalledWith('123');
            expect(mockModel.create).toHaveBeenCalledWith(expect.objectContaining({
                name: 'clone',
                description: expect.stringContaining('Clone of orig'),
                isDefault: false
            }));
            expect(result).toEqual(cloned);
        });

        it('should throw if original not found', async () => {
            mockModel.mockQuery.exec.mockResolvedValue(null);
            await expect(service.cloneFramework('123', 'clone'))
                .rejects.toThrow('Framework with id 123 not found');
        });
    });
});
