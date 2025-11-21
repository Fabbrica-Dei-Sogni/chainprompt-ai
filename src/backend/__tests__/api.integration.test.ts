import "reflect-metadata";
import request from "supertest";
import express from "express";
import bodyParser from "body-parser";

// Mock fs module FIRST to prevent filesystem access during import
jest.mock("fs", () => ({
    readdirSync: jest.fn().mockReturnValue([]),
    existsSync: jest.fn().mockReturnValue(false),
    readFileSync: jest.fn().mockReturnValue(""),
}));

// Mock dependencies BEFORE importing routes
jest.mock("../services/databases/mongodb/mongodb.client.js", () => ({}));
jest.mock("../services/databases/redis/redis.service.js", () => ({
    redisService: {}
}));

// Mock DI Container to return mocked controllers
const mockAgentConfigController = {
    getAllAgents: jest.fn((req, res) => res.status(200).json([{ name: "mock-agent" }])),
    searchAgentsByName: jest.fn(),
    getAgentById: jest.fn(),
    createAgent: jest.fn(),
    updateAgent: jest.fn(),
    deleteAgent: jest.fn()
};

jest.mock("../di/container.js", () => ({
    getComponent: jest.fn((token) => {
        if (token.name === "AgentConfigController") return mockAgentConfigController;
        return {};
    })
}));

// Import endpoint after mocks
import api from "../endpoint.js";

const app = express();
app.use(bodyParser.json());
app.use("/api/v1", api);

describe("API Integration Tests", () => {

    describe("GET /api/v1/backoffice/agentconfig", () => {
        it("should return list of agents", async () => {
            const response = await request(app).get("/api/v1/backoffice/agentconfig");

            expect(response.status).toBe(200);
            expect(response.body).toEqual([{ name: "mock-agent" }]);
            expect(mockAgentConfigController.getAllAgents).toHaveBeenCalled();
        });
    });

    // Add more tests for other endpoints as needed
});
