import "reflect-metadata";
import { container } from "tsyringe";
import { AgentConfigController } from "../agentconfig.controller.js";
import { LOGGER_TOKEN } from "../../../../core/di/tokens.js";
import { Request, Response } from "express";

// Mock dependencies
jest.mock("../../../services/databases/mongodb/services/agentconfig.service.js", () => ({
    agentConfigService: {
        findAll: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        updateById: jest.fn(),
        deleteById: jest.fn()
    }
}));

describe("AgentConfigController", () => {
    let controller: AgentConfigController;
    let mockLogger: any;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    // External mocks
    const { agentConfigService } = require("../../../services/databases/mongodb/services/agentconfig.service.js");

    beforeEach(() => {
        container.clearInstances();

        // Mock Logger
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        };
        container.register(LOGGER_TOKEN, { useValue: mockLogger });

        controller = new AgentConfigController(mockLogger);

        // Mock Request and Response
        mockReq = {
            params: {},
            query: {},
            body: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getAllAgents", () => {
        it("should return all agents", async () => {
            const mockAgents = [{ name: "agent1" }];
            agentConfigService.findAll.mockResolvedValue(mockAgents);

            await controller.getAllAgents(mockReq as Request, mockRes as Response, jest.fn());

            expect(agentConfigService.findAll).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockAgents);
        });

        it("should handle errors", async () => {
            agentConfigService.findAll.mockRejectedValue(new Error("DB Error"));
            const next = jest.fn();

            await controller.getAllAgents(mockReq as Request, mockRes as Response, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe("searchAgentsByName", () => {
        it("should return agents matching name", async () => {
            mockReq.query = { nome: "test" };
            const mockAgents = [{ name: "test-agent" }];
            agentConfigService.findAll.mockResolvedValue(mockAgents);

            await controller.searchAgentsByName(mockReq as Request, mockRes as Response, jest.fn());

            expect(agentConfigService.findAll).toHaveBeenCalledWith({
                nome: { $regex: "test", $options: 'i' }
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockAgents);
        });

        it("should return 400 if name is missing", async () => {
            mockReq.query = {};
            const next = jest.fn();
            await controller.searchAgentsByName(mockReq as Request, mockRes as Response, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: expect.stringContaining("Parametro 'nome' richiesto")
            }));
        });
    });

    describe("getAgentById", () => {
        it("should return agent if found", async () => {
            mockReq.params = { id: "123" };
            const mockAgent = { id: "123", name: "agent1" };
            agentConfigService.findById.mockResolvedValue(mockAgent);

            await controller.getAgentById(mockReq as Request, mockRes as Response, jest.fn());

            expect(agentConfigService.findById).toHaveBeenCalledWith("123");
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockAgent);
        });

        it("should return 404 if not found", async () => {
            mockReq.params = { id: "123" };
            agentConfigService.findById.mockResolvedValue(null);
            const next = jest.fn();

            await controller.getAgentById(mockReq as Request, mockRes as Response, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 404,
                message: expect.stringContaining("Agente")
            }));
        });
    });

    describe("createAgent", () => {
        it("should create agent with valid data", async () => {
            mockReq.body = {
                contesto: "ctx",
                profilo: "prof",
                promptFrameworkRef: "template-id-123"
            };
            const mockCreatedAgent = { _id: "123", ...mockReq.body };
            agentConfigService.create.mockResolvedValue(mockCreatedAgent);

            await controller.createAgent(mockReq as Request, mockRes as Response, jest.fn());

            expect(agentConfigService.create).toHaveBeenCalledWith(expect.objectContaining({
                contesto: "ctx",
                profilo: "prof",
                promptFrameworkRef: "template-id-123"
            }));

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(mockCreatedAgent);
        });

        it("should return 400 if required fields missing", async () => {
            mockReq.body = { contesto: "ctx" }; // missing profilo AND promptFrameworkRef
            const next = jest.fn();
            await controller.createAgent(mockReq as Request, mockRes as Response, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: expect.stringContaining("Campi 'contesto', 'profilo' e 'promptFrameworkRef' sono obbligatori")
            }));
        });
    });

    describe("updateAgent", () => {
        it("should update agent if found", async () => {
            mockReq.params = { id: "123" };
            mockReq.body = { name: "new-name", _id: "should-be-removed" };
            const mockUpdatedAgent = { id: "123", name: "new-name" };
            agentConfigService.updateById.mockResolvedValue(mockUpdatedAgent);

            await controller.updateAgent(mockReq as Request, mockRes as Response, jest.fn());

            expect(agentConfigService.updateById).toHaveBeenCalledWith("123", expect.objectContaining({
                name: "new-name"
            }));
            const updateCallArg = agentConfigService.updateById.mock.calls[0][1];
            expect(updateCallArg._id).toBeUndefined();

            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it("should return 404 if not found", async () => {
            mockReq.params = { id: "123" };
            agentConfigService.updateById.mockResolvedValue(null);
            const next = jest.fn();

            await controller.updateAgent(mockReq as Request, mockRes as Response, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 404,
                message: expect.stringContaining("Agente")
            }));
        });
    });

    describe("deleteAgent", () => {
        it("should delete agent if found", async () => {
            mockReq.params = { id: "123" };
            agentConfigService.deleteById.mockResolvedValue(true);

            await controller.deleteAgent(mockReq as Request, mockRes as Response, jest.fn());

            expect(agentConfigService.deleteById).toHaveBeenCalledWith("123");
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it("should return 404 if not found", async () => {
            mockReq.params = { id: "123" };
            agentConfigService.deleteById.mockResolvedValue(false);
            const next = jest.fn();

            await controller.deleteAgent(mockReq as Request, mockRes as Response, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 404,
                message: expect.stringContaining("Agente")
            }));
        });
    });
});
