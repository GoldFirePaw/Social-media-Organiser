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

const sanitizeThemeName = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > 100) throw new Error('Theme name too long')
  return trimmed
}

export async function ideasRoutes(fastify: FastifyInstance) {
  fastify.post("/ideas", async (request, reply) => {
    try {
      const { title, description, platform, difficulty, themes } = request.body as {
        title: string;
        description?: string | null;
        platform: "BOOKTOK" | "DEVTOK";
        difficulty?: number;
        themes?: string[];
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

      const themeNames = (themes ?? []).map(sanitizeThemeName).filter((t): t is string => Boolean(t))

      return prisma.$transaction(async (tx) => {
        const themeRecords = await Promise.all(
          themeNames.map((name) =>
            tx.theme.upsert({
              where: { name },
              update: {},
              create: { name },
            }),
          ),
        )

        return tx.idea.create({
          data: {
            title: validTitle,
            description: validDescription,
            platform: validPlatform,
            difficulty: validDifficulty,
            themes: themeRecords.length
              ? {
                  create: themeRecords.map((theme) => ({ themeId: theme.id })),
                }
              : undefined,
          },
        })
      })
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
        themes: {
          include: {
            theme: true,
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
      themes: idea.themes.map((link) => link.theme.name),
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
      const { title, description, platform, status, difficulty, themes } =
        request.body as {
          title?: string;
          description?: string | null;
          platform?: "BOOKTOK" | "DEVTOK";
          status?: "IDEA" | "PLANNED" | "DONE";
          difficulty?: number;
          themes?: string[];
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

      const themeNames = Array.isArray(themes)
        ? themes.map(sanitizeThemeName).filter((t): t is string => Boolean(t))
        : undefined

      const updatedIdea = await prisma.$transaction(async (tx) => {
        let themeSet = undefined as { set: { themeId: string }[] } | undefined
        if (themeNames) {
          const records = await Promise.all(
            themeNames.map((name) =>
              tx.theme.upsert({
                where: { name },
                update: {},
                create: { name },
              }),
            ),
          )
          themeSet = { set: records.map((theme) => ({ themeId: theme.id })) }
        }

        return tx.idea.update({
          where: { id },
          data: {
            ...data,
            themes: themeSet,
          },
        })
      })
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

  fastify.get('/themes', async () => {
    const themes = await prisma.theme.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { ideas: true },
        },
      },
    })
    return themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      usageCount: theme._count.ideas,
    }))
  })
}
