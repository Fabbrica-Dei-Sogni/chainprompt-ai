import { getMessageHistory, getChainWithHistory, logConversationHistory } from '../redis.service.js';
import { RedisChatMessageHistory } from "@langchain/redis";
import { REDIS_CLIENT_INSTANCE } from "../redis.client.js";
import { RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables";
import { getPromptTemplate } from "../../../../templates/chainpromptbase.template.js";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Mock dependencies
jest.mock("@langchain/redis");
jest.mock("../redis.client.js", () => ({
    REDIS_CLIENT_INSTANCE: {
        client: {}
    }
}));
jest.mock("@langchain/core/runnables");
jest.mock("../../../../templates/chainpromptbase.template.js");
jest.mock("@langchain/core/output_parsers");

describe('RedisService', () => {
    const mockSessionId = 'test-session-id';
    const mockSystemPrompt = 'test-prompt';
    const mockLLM = { invoke: jest.fn() } as any;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getMessageHistory', () => {
        it('should create RedisChatMessageHistory with correct parameters', async () => {
            await getMessageHistory(mockSessionId);

            expect(RedisChatMessageHistory).toHaveBeenCalledWith({
                sessionId: `conversation:${mockSessionId}`,
                client: REDIS_CLIENT_INSTANCE.client,
                sessionTTL: 86400,
            });
        });
    });

    describe('getChainWithHistory', () => {
        it('should create a chain with history', async () => {
            (getPromptTemplate as jest.Mock).mockReturnValue('mock-template');
            (RunnableSequence.from as jest.Mock).mockReturnValue('mock-base-chain');

            await getChainWithHistory(mockSystemPrompt, mockLLM, false, mockSessionId);

            expect(getPromptTemplate).toHaveBeenCalledWith(mockSystemPrompt);
            expect(RunnableSequence.from).toHaveBeenCalled();
            expect(RunnableWithMessageHistory).toHaveBeenCalledWith(expect.objectContaining({
                runnable: 'mock-base-chain',
                inputMessagesKey: "input",
                historyMessagesKey: "history",
            }));
        });

        it('should clear history if noappendchat is true', async () => {
            const mockHistory = { clear: jest.fn() };
            (RedisChatMessageHistory as unknown as jest.Mock).mockImplementation(() => mockHistory);

            await getChainWithHistory(mockSystemPrompt, mockLLM, true, mockSessionId);

            expect(mockHistory.clear).toHaveBeenCalled();
        });
    });

    describe('logConversationHistory', () => {
        it('should log messages from history', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const mockMessages = [
                { _getType: () => 'human', content: 'hello' },
                { _getType: () => 'ai', content: 'world' }
            ];
            const mockHistory = { getMessages: jest.fn().mockResolvedValue(mockMessages) };
            (RedisChatMessageHistory as unknown as jest.Mock).mockImplementation(() => mockHistory);

            await logConversationHistory(mockSessionId);

            expect(mockHistory.getMessages).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(mockSessionId));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('human'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('hello'));

            consoleSpy.mockRestore();
        });
    });
});
