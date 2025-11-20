import dotenv from "dotenv";
dotenv.config();

export const CONTEXT_MANAGER = 'manager'
// Define file names and fixed URI
export const contextFolder = process.env.PATH_FILESET || 'datasets/fileset';

// Define constants
export const SYSTEMPROMPT_DFL = 'Sei gentile e professionale';
export const ENDPOINT_CHATGENERICA = 'chatgenerica'

//Connessione al database mongodb
const hostname = process.env.MONGODB_HOST;
const portdb = process.env.MONGODB_PORT;
const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;
const database = process.env.MONGODB_DATABASE;
export const dbHost = `mongodb://${username}:${password}@${hostname}:${portdb}/${database}`;
