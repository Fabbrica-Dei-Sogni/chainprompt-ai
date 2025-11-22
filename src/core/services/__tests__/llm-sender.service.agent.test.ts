import { LLMSenderService } from "../llm-sender.service.js";
import type { Logger } from "winston";

describe("LLMSenderService.senderToAgent", () => {
  it("calls llmAgentService.getAgent and invokeAgent", async () => {
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as Logger;
    const dummyLLMChainService = {
      getInstanceLLM: jest.fn().mockReturnValue("llm-instance"),
    };
    const mockAgent = {};
    const dummyLLMAgentService = {
      getAgent: jest.fn().mockReturnValue(mockAgent),
      invokeAgent: jest.fn().mockResolvedValue("agent-result"),
    };
    const service = new LLMSenderService(mockLogger, dummyLLMChainService as any, dummyLLMAgentService as any);
    const config: any = { provider: "test-provider" }; // aggiungi almeno la proprietà richiesta
    const result = await service.senderToAgent("Q", "sess", config, "sys", [], [], "agentName");
      
    expect(dummyLLMAgentService.getAgent).toHaveBeenCalledWith(
      "llm-instance",
      "sys",
      [],
      [],
      "agentName"
    );
    expect(dummyLLMAgentService.invokeAgent).toHaveBeenCalledWith(mockAgent, "Q", "sess");
    expect(result).toBe("agent-result");
  });
});
