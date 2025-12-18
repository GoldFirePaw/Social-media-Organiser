import { FastifyInstance } from 'fastify'
import { prisma } from '../prisma'

export async function ideasRoutes(fastify: FastifyInstance) {
  fastify.post("/ideas", async (request) => {
    const { title, description, platform, difficulty } = request.body as {
      title: string;
      description?: string | null;
      platform: "BOOKTOK" | "DEVTOK";
      difficulty?: number;
    };

    return prisma.idea.create({
      data: {
        title,
        description,
        platform,
        difficulty: difficulty ?? 2,
      },
    });
  });

  fastify.get("/ideas", async (request) => {
    const { platform, status, difficulty } = request.query as {
      platform?: "BOOKTOK" | "DEVTOK";
      status?: "IDEA" | "PLANNED" | "DONE";
      difficulty?: string;
    };

    return prisma.idea.findMany({
      where: {
        platform,
        status,
        difficulty: difficulty ? Number(difficulty) : undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  fastify.delete("/ideas", async (request) => {
    const { id } = request.query as { id: string };

    return prisma.idea.delete({
      where: { id },
    });
  });
}

