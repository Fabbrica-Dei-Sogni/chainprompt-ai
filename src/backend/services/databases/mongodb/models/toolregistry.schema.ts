import { Schema, model, Document } from "mongoose";

export interface IToolRegistry extends Document {
  name: string;
  modulePath: string;
  description?: string;
  config?: Record<string, any>;
  enabled: boolean;
}

const ToolRegistrySchema = new Schema<IToolRegistry>({
  name: { type: String, required: true, unique: true },
  modulePath: { type: String, required: true },
  description: { type: String, required: false },
  config: { type: Schema.Types.Mixed, required: false },
  enabled: { type: Boolean, required: true, default: true }
});

export const ToolRegistry = model<IToolRegistry>("ToolRegistry", ToolRegistrySchema);
