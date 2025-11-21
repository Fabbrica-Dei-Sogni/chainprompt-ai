import "reflect-metadata";
import { container } from "tsyringe";
import { ConfigurationController } from "../configuration.controller.js";
import { LOGGER_TOKEN } from "../../../../core/di/tokens.js";
import { Request, Response } from "express";

// Mock dependencies
jest.mock("../../../services/databases/mongodb/services/config.service.js", () => ({
    configService: {
        getAllConfigs: jest.fn(),
        findAll: jest.fn(),
        getConfigValue: jest.fn(),
        saveConfig: jest.fn(),
        deleteByKey: jest.fn()
    }
}));

describe("ConfigurationController", () => {
    let controller: ConfigurationController;
    let mockLogger: any;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    // External mocks
    const { configService } = require("../../../services/databases/mongodb/services/config.service.js");

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

        controller = new ConfigurationController(mockLogger);

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

    describe("getAllConfigurations", () => {
        it("should return all configs when no search query", async () => {
            const mockConfigs = [{ key: "k1", value: "v1" }];
            configService.getAllConfigs.mockResolvedValue(mockConfigs);

            await controller.getAllConfigurations(mockReq as Request, mockRes as Response);

            expect(configService.getAllConfigs).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockConfigs);
        });

        it("should search configs when search query provided", async () => {
            mockReq.query = { search: "test" };
            const mockConfigs = [{ key: "test-key", value: "v1" }];
            configService.findAll.mockResolvedValue(mockConfigs);

            await controller.getAllConfigurations(mockReq as Request, mockRes as Response);

            expect(configService.findAll).toHaveBeenCalledWith({
                key: { $regex: "test", $options: 'i' }
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockConfigs);
        });

        it("should handle errors", async () => {
            configService.getAllConfigs.mockRejectedValue(new Error("DB Error"));

            await controller.getAllConfigurations(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe("getConfigByKey", () => {
        it("should return config if found", async () => {
            mockReq.params = { key: "k1" };
            configService.getConfigValue.mockResolvedValue("v1");

            await controller.getConfigByKey(mockReq as Request, mockRes as Response);

            expect(configService.getConfigValue).toHaveBeenCalledWith("k1");
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ key: "k1", value: "v1" });
        });

        it("should return 404 if not found", async () => {
            mockReq.params = { key: "k1" };
            configService.getConfigValue.mockResolvedValue(null);

            await controller.getConfigByKey(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe("saveConfiguration", () => {
        it("should save config with valid data", async () => {
            mockReq.body = { key: "k1", value: "v1" };
            const mockSavedConfig = { key: "k1", value: "v1" };
            configService.saveConfig.mockResolvedValue(mockSavedConfig);

            await controller.saveConfiguration(mockReq as Request, mockRes as Response);

            expect(configService.saveConfig).toHaveBeenCalledWith("k1", "v1");
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockSavedConfig);
        });

        it("should return 400 if key missing", async () => {
            mockReq.body = { value: "v1" };
            await controller.saveConfiguration(mockReq as Request, mockRes as Response);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it("should return 400 if value missing", async () => {
            mockReq.body = { key: "k1" };
            await controller.saveConfiguration(mockReq as Request, mockRes as Response);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe("deleteConfiguration", () => {
        it("should delete config if found", async () => {
            mockReq.params = { key: "k1" };
            configService.deleteByKey.mockResolvedValue(true);

            await controller.deleteConfiguration(mockReq as Request, mockRes as Response);

            expect(configService.deleteByKey).toHaveBeenCalledWith("k1");
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it("should return 404 if not found", async () => {
            mockReq.params = { key: "k1" };
            configService.deleteByKey.mockResolvedValue(false);

            await controller.deleteConfiguration(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });
});
