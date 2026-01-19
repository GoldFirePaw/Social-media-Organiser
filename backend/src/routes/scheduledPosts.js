"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledPostsRoutes = scheduledPostsRoutes;
const prisma_1 = require("../prisma");
function validateString(value, maxLength = 10000) {
    if (value === null || value === undefined)
        return null;
    if (typeof value !== "string")
        throw new Error("Invalid input: expected string");
    if (value.length > maxLength)
        throw new Error(`Input exceeds maximum length of ${maxLength}`);
    return value;
}
function validateEnum(value, allowed) {
    if (!allowed.includes(value)) {
        throw new Error(`Invalid value: must be one of ${allowed.join(", ")}`);
    }
    return value;
}
async function scheduledPostsRoutes(fastify) {
    fastify.post("/scheduled-posts", async (request, reply) => {
        try {
            const { ideaId, date, description, status } = request.body;
            if (!ideaId || !date) {
                return reply
                    .status(400)
                    .send({ message: "Missing fields: ideaId and date required" });
            }
            const validDescription = description
                ? validateString(description, 10000)
                : null;
            const validStatus = status
                ? validateEnum(status, ["NOT_STARTED", "PREPARING", "READY", "POSTED"])
                : "NOT_STARTED";
            try {
                return await prisma_1.prisma.scheduledPost.create({
                    data: {
                        ideaId,
                        date: new Date(date),
                        description: validDescription,
                        status: validStatus,
                    },
                    include: {
                        idea: true,
                    },
                });
            }
            catch (error) {
                if (error.code === "P2002") {
                    return reply
                        .status(409)
                        .send({ message: "Idea already planned for this date" });
                }
                throw error;
            }
        }
        catch (error) {
            return reply
                .status(400)
                .send({ message: error.message || "Invalid input" });
        }
    });
    fastify.get("/scheduled-posts", async () => {
        return prisma_1.prisma.scheduledPost.findMany({
            include: {
                idea: true,
            },
            orderBy: {
                date: "asc",
            },
        });
    });
    fastify.put("/scheduled-posts/:id", async (request, reply) => {
        try {
            const { id } = request.params;
            const { date, description, status } = request.body;
            if (!date &&
                typeof description === "undefined" &&
                typeof status === "undefined") {
                return reply.status(400).send({ message: "Missing fields" });
            }
            const data = {};
            if (date) {
                data.date = new Date(date);
            }
            if (typeof description !== "undefined") {
                data.description = description
                    ? validateString(description, 10000)
                    : null;
            }
            if (typeof status !== "undefined") {
                data.status = validateEnum(status, [
                    "NOT_STARTED",
                    "PREPARING",
                    "READY",
                    "POSTED",
                ]);
            }
            try {
                return await prisma_1.prisma.scheduledPost.update({
                    where: { id },
                    data,
                    include: {
                        idea: true,
                    },
                });
            }
            catch (error) {
                if (error.code === "P2025") {
                    return reply
                        .status(404)
                        .send({ message: "Scheduled post not found" });
                }
                if (error.code === "P2002") {
                    return reply
                        .status(409)
                        .send({ message: "Idea already planned for this date" });
                }
                throw error;
            }
        }
        catch (error) {
            return reply
                .status(400)
                .send({ message: error.message || "Invalid input" });
        }
    });
    fastify.delete('/scheduled-posts/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            await prisma_1.prisma.scheduledPost.delete({
                where: { id },
            });
            return reply.status(204).send();
        }
        catch (error) {
            if (error.code === 'P2025') {
                return reply.status(404).send({ message: 'Scheduled post not found' });
            }
            throw error;
        }
    });
}
