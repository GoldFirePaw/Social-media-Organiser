import { FastifyInstance } from 'fastify'
import { prisma } from '../prisma'

export async function scheduledPostsRoutes(fastify: FastifyInstance) {
  fastify.post('/scheduled-posts', async (request, reply) => {
    const { ideaId, date } = request.body as {
      ideaId: string
      date: string
    }

    if (!ideaId || !date) {
      return reply.status(400).send({ message: 'Missing fields' })
    }

    try {
      return await prisma.scheduledPost.create({
        data: {
          ideaId,
          date: new Date(date),
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
  const { date } = request.body as { date: string }

  if (!date) {
    return reply.status(400).send({ message: 'Missing date' })
  }

  try {
    return await prisma.scheduledPost.update({
      where: { id },
      data: {
        date: new Date(date),
      },
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
