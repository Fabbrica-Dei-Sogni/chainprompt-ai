import { ConfigService } from '../config.service.js';
import { Configuration } from '../../models/config.schema.js';
import logger from '../../../../../logger.backend.js';

// Mock dependencies
jest.mock('../../models/config.schema.js');
jest.mock('../../../../../logger.backend.js', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}));

describe('ConfigService', () => {
    let service: ConfigService;
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
            findOneAndUpdate: jest.fn().mockReturnValue(mockQuery),
            findOneAndDelete: jest.fn().mockReturnValue(mockQuery),
            mockQuery // expose for assertions
        };

        // Mock the Configuration model methods directly
        (Configuration.find as jest.Mock) = mockModel.find;
        (Configuration.findOne as jest.Mock) = mockModel.findOne;
        (Configuration.findById as jest.Mock) = mockModel.findById;
        (Configuration.create as jest.Mock) = mockModel.create;
        (Configuration.findByIdAndUpdate as jest.Mock) = mockModel.findByIdAndUpdate;
        (Configuration.findByIdAndDelete as jest.Mock) = mockModel.findByIdAndDelete;
        (Configuration.findOneAndUpdate as jest.Mock) = mockModel.findOneAndUpdate;
        (Configuration.findOneAndDelete as jest.Mock) = mockModel.findOneAndDelete;

        service = new ConfigService();
    });

    describe('saveConfig', () => {
        it('should save configuration', async () => {
            const mockConfig = { key: 'k', value: 'v' };
            mockModel.mockQuery.exec.mockResolvedValue(mockConfig); // findOneAndUpdate returns query

            // However, findOneAndUpdate usually returns a Query, but in some mongoose versions/usages it might be awaitable directly if not using exec().
            // In the service: this.model.findOneAndUpdate(..., ..., ...);
            // It does NOT call .exec() in the service code shown previously?
            // Let's check the service code provided in context.
            // Step 216: 
            // const result = await this.model.findOneAndUpdate(
            //   { key },
            //   { value },
            //   { upsert: true, new: true, setDefaultsOnInsert: true }
            // );
            // It does NOT call .exec(). So it awaits the Query object (which is thenable) or the result directly if mocked that way.
            // If we mock findOneAndUpdate to return a promise resolving to the doc, it should work.

            mockModel.findOneAndUpdate.mockResolvedValue(mockConfig);

            const result = await service.saveConfig('k', 'v');

            expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
                { key: 'k' },
                { value: 'v' },
                expect.objectContaining({ upsert: true, new: true })
            );
            expect(logger.info).toHaveBeenCalled();
            expect(result).toEqual(mockConfig);
        });

        it('should handle errors', async () => {
            mockModel.findOneAndUpdate.mockRejectedValue(new Error('DB Error'));

            await expect(service.saveConfig('k', 'v')).rejects.toThrow('DB Error');
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getConfigValue', () => {
        it('should return config value if found', async () => {
            const mockConfig = { key: 'k', value: 'v' };
            // In service: const config = await this.model.findOne({ key });
            // It does NOT call .exec().
            mockModel.findOne.mockResolvedValue(mockConfig);

            const result = await service.getConfigValue('k');

            expect(mockModel.findOne).toHaveBeenCalledWith({ key: 'k' });
            expect(result).toBe('v');
        });

        it('should return null if not found', async () => {
            mockModel.findOne.mockResolvedValue(null);

            const result = await service.getConfigValue('k');

            expect(result).toBeNull();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            mockModel.findOne.mockRejectedValue(new Error('DB Error'));

            await expect(service.getConfigValue('k')).rejects.toThrow('DB Error');
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getAllConfigs', () => {
        it('should return all configs', async () => {
            const mockConfigs = [{ key: 'k', value: 'v' }];
            // In service: const configs = await this.model.find({});
            // It does NOT call .exec().
            mockModel.find.mockResolvedValue(mockConfigs);

            const result = await service.getAllConfigs();

            expect(mockModel.find).toHaveBeenCalledWith({});
            expect(result).toEqual(mockConfigs);
        });

        it('should handle errors', async () => {
            mockModel.find.mockRejectedValue(new Error('DB Error'));

            await expect(service.getAllConfigs()).rejects.toThrow('DB Error');
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('deleteByKey', () => {
        it('should delete config if found', async () => {
            const mockConfig = { key: 'k' };
            // In service: const result = await this.model.findOneAndDelete({ key });
            // It does NOT call .exec().
            mockModel.findOneAndDelete.mockResolvedValue(mockConfig);

            const result = await service.deleteByKey('k');

            expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({ key: 'k' });
            expect(result).toBe(true);
        });

        it('should return false if not found', async () => {
            mockModel.findOneAndDelete.mockResolvedValue(null);

            const result = await service.deleteByKey('k');

            expect(result).toBe(false);
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            mockModel.findOneAndDelete.mockRejectedValue(new Error('DB Error'));

            await expect(service.deleteByKey('k')).rejects.toThrow('DB Error');
            expect(logger.error).toHaveBeenCalled();
        });
    });
});
