import dotenv from "dotenv";
dotenv.config();

export const CONTEXT_MANAGER = 'manager'
// Define file names and fixed URI
export const contextFolder = process.env.PATH_FILESET || 'datasets/fileset';

// Define constants
export const SYSTEMPROMPT_DFL = 'Sei gentile e professionale';
export const ENDPOINT_CHATGENERICA = 'chatgenerica'