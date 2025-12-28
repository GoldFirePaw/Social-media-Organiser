import "dotenv/config";
import Fastify from "fastify";
import { ideasRoutes } from "./routes/ideas";
import cors from "@fastify/cors";
import { scheduledPostsRoutes } from "./routes/scheduledPosts";
import { authRoutes } from "./auth";

const fastify = Fastify({
  logger: true,
});

fastify.get("/health", async () => {
  return { status: "ok" };
});

fastify.register(cors, {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
});

fastify.register(authRoutes);

fastify.listen({ port: 3001 });
fastify.register(ideasRoutes);
fastify.register(scheduledPostsRoutes);
