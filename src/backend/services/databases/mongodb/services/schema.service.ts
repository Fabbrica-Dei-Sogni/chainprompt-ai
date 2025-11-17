import { Model, Document, FilterQuery } from 'mongoose';

// Interfaccia CRUD
export interface ISchemaService<T> {
  create(data: Partial<T>): Promise<T>;
  findAll(filter?: FilterQuery<T>): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  updateById(id: string, data: Partial<T>): Promise<T | null>;
  deleteById(id: string): Promise<boolean>;
}

// Classe base generica
export class SchemaService<T extends Document> implements ISchemaService<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data); // gestisci tipizzazione del create
  }

  async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async updateById(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const res = await this.model.findByIdAndDelete(id).exec();
    return !!res;
  }
}
