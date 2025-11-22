import { SchemaService } from '../schema.service.js';
import { Document, Model } from 'mongoose';

// Define a concrete implementation for testing
interface ITestDoc extends Document {
    name: string;
}

class TestService extends SchemaService<ITestDoc> {
    constructor(model: Model<ITestDoc>) {
        super(model);
    }
}

describe('SchemaService', () => {
    let service: TestService;
    let mockModel: any;

    beforeEach(() => {
        jest.clearAllMocks();

        const mockQuery = {
            exec: jest.fn(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis()
        };

        mockModel = {
            create: jest.fn(),
            find: jest.fn().mockReturnValue(mockQuery),
            findById: jest.fn().mockReturnValue(mockQuery),
            findByIdAndUpdate: jest.fn().mockReturnValue(mockQuery),
            findByIdAndDelete: jest.fn().mockReturnValue(mockQuery),
            mockQuery
        };

        service = new TestService(mockModel);
    });

    describe('create', () => {
        it('should create a document', async () => {
            const data = { name: 'test' };
            mockModel.create.mockResolvedValue(data);

            const result = await service.create(data);

            expect(mockModel.create).toHaveBeenCalledWith(data);
            expect(result).toEqual(data);
        });
    });

    describe('findAll', () => {
        it('should find all documents', async () => {
            const docs = [{ name: 'test' }];
            mockModel.mockQuery.exec.mockResolvedValue(docs);

            const result = await service.findAll();

            expect(mockModel.find).toHaveBeenCalledWith({});
            expect(result).toEqual(docs);
        });

        it('should find documents with filter', async () => {
            const filter = { name: 'test' };
            const docs = [{ name: 'test' }];
            mockModel.mockQuery.exec.mockResolvedValue(docs);

            const result = await service.findAll(filter);

            expect(mockModel.find).toHaveBeenCalledWith(filter);
            expect(result).toEqual(docs);
        });
    });

    describe('findById', () => {
        it('should find document by id', async () => {
            const doc = { name: 'test' };
            mockModel.mockQuery.exec.mockResolvedValue(doc);

            const result = await service.findById('123');

            expect(mockModel.findById).toHaveBeenCalledWith('123');
            expect(result).toEqual(doc);
        });
    });

    describe('updateById', () => {
        it('should update document by id', async () => {
            const data = { name: 'updated' };
            const doc = { name: 'updated' };
            mockModel.mockQuery.exec.mockResolvedValue(doc);

            const result = await service.updateById('123', data);

            expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('123', data, { new: true });
            expect(result).toEqual(doc);
        });
    });

    describe('deleteById', () => {
        it('should delete document by id', async () => {
            mockModel.mockQuery.exec.mockResolvedValue({ deletedCount: 1 });
            // Wait, findByIdAndDelete returns the document usually, or null.
            // SchemaService logic:
            // async deleteById(id: string): Promise<boolean> {
            //   const result = await this.model.findByIdAndDelete(id).exec();
            //   return !!result;
            // }

            const doc = { name: 'deleted' };
            mockModel.mockQuery.exec.mockResolvedValue(doc);

            const result = await service.deleteById('123');

            expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('123');
            expect(result).toBe(true);
        });

        it('should return false if document not found', async () => {
            mockModel.mockQuery.exec.mockResolvedValue(null);

            const result = await service.deleteById('123');

            expect(result).toBe(false);
        });
    });
});
