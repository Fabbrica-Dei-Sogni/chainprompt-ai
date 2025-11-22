import { LLMSenderService } from "../llm-sender.service.js";
import type { Logger } from "winston";

describe("LLMSenderService.invokeChain error branch", () => {
  it("calls logger.error when chain.invoke throws", async () => {
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as Logger;
    const dummyLLMChainService = {} as any;
    const dummyLLMAgentService = {} as any;
    const service = new LLMSenderService(mockLogger, dummyLLMChainService, dummyLLMAgentService);
    const mockChain = {
      invoke: jest.fn().mockRejectedValue(new Error("fail")),
    } as any;
    await expect(service.invokeChain({ content: "Q", role: "user" } as any, "sess", mockChain)).rejects.toThrow("Errore invokeChain: fail");
    expect(mockLogger.error).toHaveBeenCalledWith("Errore durante l'invocazione della chain LLM:", expect.any(Error));
  });
});
