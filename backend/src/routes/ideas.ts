import { FastifyInstance } from 'fastify'
import { prisma } from '../prisma'

function validateString(
  value: unknown,
  maxLength: number = 10000
): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string")
    throw new Error("Invalid input: expected string");
  if (value.length > maxLength)
    throw new Error(`Input exceeds maximum length of ${maxLength}`);
  return value;
}

function validateEnum<T>(value: unknown, allowed: T[]): T {
  if (!allowed.includes(value as T)) {
    throw new Error(`Invalid value: must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}

export async function ideasRoutes(fastify: FastifyInstance) {
  fastify.post("/ideas", async (request, reply) => {
    try {
      const { title, description, platform, difficulty } = request.body as {
        title: string;
        description?: string | null;
        platform: "BOOKTOK" | "DEVTOK";
        difficulty?: number;
      };

      const validTitle = validateString(title, 500);
      if (!validTitle) {
        return reply.status(400).send({ message: "Title is required" });
      }
      const validDescription = description
        ? validateString(description, 10000)
        : null;
      const validPlatform = validateEnum(platform, ["BOOKTOK", "DEVTOK"]) as
        | "BOOKTOK"
        | "DEVTOK";
      const validDifficulty =
        difficulty && (difficulty < 1 || difficulty > 3) ? 2 : difficulty ?? 2;

      return prisma.idea.create({
        data: {
          title: validTitle,
          description: validDescription,
          platform: validPlatform,
          difficulty: validDifficulty,
        },
      });
    } catch (error: any) {
      return reply
        .status(400)
        .send({ message: error.message || "Invalid input" });
    }
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
    try {
      const { id } = request.params as { id: string };
      const { title, description, platform, status, difficulty } =
        request.body as {
          title?: string;
          description?: string | null;
          platform?: "BOOKTOK" | "DEVTOK";
          status?: "IDEA" | "PLANNED" | "DONE";
          difficulty?: number;
        };

      if (!id) {
        return reply.status(400).send({ message: "ID is required" });
      }

      const data: any = {};
      if (title !== undefined) {
        data.title = validateString(title, 500);
        if (!data.title) throw new Error("Title cannot be empty");
      }
      if (description !== undefined) {
        data.description = description
          ? validateString(description, 10000)
          : null;
      }
      if (platform !== undefined) {
        data.platform = validateEnum(platform, ["BOOKTOK", "DEVTOK"]) as
          | "BOOKTOK"
          | "DEVTOK";
      }
      if (status !== undefined) {
        data.status = validateEnum(status, ["IDEA", "PLANNED", "DONE"]) as
          | "IDEA"
          | "PLANNED"
          | "DONE";
      }
      if (difficulty !== undefined) {
        if (difficulty < 1 || difficulty > 3)
          throw new Error("Difficulty must be 1, 2, or 3");
        data.difficulty = difficulty;
      }

      const updatedIdea = await prisma.idea.update({
        where: { id },
        data,
      });
      return updatedIdea;
    } catch (error: any) {
      if ((error as any).code === "P2025") {
        return reply.status(404).send({ message: "Idea not found" });
      }
      return reply
        .status(400)
        .send({ message: error.message || "Invalid input" });
    }
  });
}
