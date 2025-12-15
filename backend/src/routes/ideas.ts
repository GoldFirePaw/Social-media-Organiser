import { FastifyInstance } from 'fastify'
import { prisma } from '../prisma'

export async function ideasRoutes(fastify: FastifyInstance) {
  fastify.post('/ideas', async (request) => {
    const { title, description, platform } = request.body as {
      title: string
      description?: string
      platform: 'BOOKTOK' | 'DEVTOK'
    }

    return prisma.idea.create({
      data: {
        title,
        description,
        platform,
      },
    })
  })

  fastify.get('/ideas', async (request) => {
  const { platform, status } = request.query as {
    platform?: 'BOOKTOK' | 'DEVTOK'
    status?: 'IDEA' | 'PLANNED' | 'DONE'
  }

  return prisma.idea.findMany({
    where: {
      platform,
      status,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
})

fastify.delete('/ideas', async (request) => {
  const { id } = request.query as { id: string }

  return prisma.idea.delete({
    where: { id },
  })
})

  fastify.put('/ideas/:id', async (request) => {
    const { id } = request.params as { id: string }
    const { title, description, platform, status } = request.body as {
      title: string
      description?: string | null
      platform: 'BOOKTOK' | 'DEVTOK'
      status: 'IDEA' | 'PLANNED' | 'DONE'
    }

    return prisma.idea.update({
      where: { id },
      data: {
        title,
        description,
        platform,
        status,
      },
    })
  })
}
