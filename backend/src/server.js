"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const ideas_1 = require("./routes/ideas");
const cors_1 = __importDefault(require("@fastify/cors"));
const scheduledPosts_1 = require("./routes/scheduledPosts");
const auth_1 = require("./auth");
const export_1 = require("./routes/export");
const fastify = (0, fastify_1.default)({
    logger: true,
});
fastify.get("/health", async () => {
    return { status: "ok" };
});
fastify.register(cors_1.default, {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
});
fastify.register(auth_1.authRoutes);
fastify.listen({ port: 3001 });
fastify.register(ideas_1.ideasRoutes);
fastify.register(scheduledPosts_1.scheduledPostsRoutes);
fastify.register(export_1.exportRoutes);
