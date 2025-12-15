import { FastifyInstance } from 'fastify'
import { prisma } from '../prisma'

export async function scheduledPostsRoutes(fastify: FastifyInstance) {
  fastify.post('/scheduled-posts', async (request, reply) => {
    const { ideaId, date, description } = request.body as {
      ideaId: string
      date: string
      description?: string | null
    }

    if (!ideaId || !date) {
      return reply.status(400).send({ message: 'Missing fields' })
    }

    try {
      return await prisma.scheduledPost.create({
        data: {
          ideaId,
          date: new Date(date),
          description: description ?? null,
        },
        include: {
          idea: true,
        },
      })
    } catch (error: any) {
      // Contrainte unique violée
      if (error.code === 'P2002') {
        return reply
          .status(409)
          .send({ message: 'Idea already planned for this date' })
      }

      throw error
    }
  })

  fastify.get('/scheduled-posts', async () => {
    return prisma.scheduledPost.findMany({
      include: {
        idea: true,
      },
      orderBy: {
        date: 'asc',
      },
    })
  })

  fastify.put('/scheduled-posts/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { date, description } = request.body as {
      date?: string
      description?: string | null
    }

    if (!date && typeof description === 'undefined') {
      return reply.status(400).send({ message: 'Missing fields' })
    }

    const data: { date?: Date; description?: string | null } = {}
    if (date) {
      data.date = new Date(date)
    }
    if (typeof description !== 'undefined') {
      data.description = description ?? null
    }

    try {
      return await prisma.scheduledPost.update({
        where: { id },
        data,
        include: {
          idea: true,
        },
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ message: 'Scheduled post not found' })
      }

      throw error
    }
  })

  fastify.delete('/scheduled-posts/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      await prisma.scheduledPost.delete({
        where: { id },
      })

      return reply.status(204).send()
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ message: 'Scheduled post not found' })
      }

      throw error
    }
  })
}
