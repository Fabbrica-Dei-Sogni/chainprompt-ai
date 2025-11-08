import { LLMProvider } from "../models/llmprovider.enum.js";
import { DataRequest } from "../interfaces/datarequest.js";
import { CybersecurityAPITool } from "../tools/cybersecurityapi.tool.js";
import { getAgent, invokeAgent } from "../services/agent.service.js";


export async function getAnswerByThreatIntel(inputData: DataRequest, systemPrompt: string, provider: LLMProvider) { 
    const { question }: DataRequest = inputData;

    const agent = await getAgent(inputData, provider, systemPrompt, [new CybersecurityAPITool()]);
    const result = await invokeAgent(agent, question!);

    return result;
}


