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

    const ideas = await prisma.idea.findMany({
      where: {
        platform,
        status,
        difficulty: difficulty ? Number(difficulty) : undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            scheduledPosts: true,
          },
        },
        scheduledPosts: {
          orderBy: {
            date: "desc",
          },
          take: 1,
          select: {
            date: true,
          },
        },
      },
    });

    return ideas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      platform: idea.platform,
      status: idea.status,
      difficulty: idea.difficulty,
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt,
      scheduledPostsCount: idea._count.scheduledPosts,
      lastScheduledPostDate: idea.scheduledPosts[0]?.date ?? null,
    }));
  });

  fastify.delete("/ideas", async (request) => {
    const { id } = request.query as { id: string };

    return prisma.idea.delete({
      where: { id },
    });
  });

  fastify.put("/ideas/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { title, description, platform, status, difficulty } = request.body as {
      title?: string;
      description?: string | null;
      platform?: "BOOKTOK" | "DEVTOK";
      status?: "IDEA" | "PLANNED" | "DONE";
      difficulty?: number;
    };

    try {
      const updatedIdea = await prisma.idea.update({
        where: { id },
        data: {
          title,
          description,
          platform,
          status,
          difficulty,
        },
      });
      return updatedIdea;
    } catch (error) {
      reply.code(404);
      return {
        message: `Idea with id ${id} not found`,
        error: "Not Found",
        statusCode: 404,
      };
    }
  });
}
