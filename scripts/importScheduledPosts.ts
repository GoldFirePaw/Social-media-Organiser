const fs = require('node:fs/promises')

async function importScheduledPosts() {
  const posts = JSON.parse(await fs.readFile('backend/scheduled-posts-export.json', 'utf8'))

  const ideasResponse = await fetch('http://localhost:3001/ideas')
  if (!ideasResponse.ok) {
    throw new Error(`Failed to fetch ideas: ${await ideasResponse.text()}`)
  }
  const ideas = await ideasResponse.json()
  const ideaById = new Map(ideas.map((idea) => [idea.id, idea.id]))
  const ideaByTitle = new Map(ideas.map((idea) => [idea.title.trim().toLowerCase(), idea.id]))

  for (const post of posts) {
    const fallbackTitle =
      post.idea?.title ??
      post.title ??
      (post.ideaId ? ideas.find((idea) => idea.id === post.ideaId)?.title : undefined) ??
      ''

    const existingIdeaId =
      post.ideaId && ideaById.has(post.ideaId)
        ? post.ideaId
        : ideaByTitle.get((fallbackTitle ?? '').trim().toLowerCase())

    if (!existingIdeaId) {
      console.warn(`Skipping scheduled post; no matching idea found for "${fallbackTitle || post.ideaId}"`)
      continue
    }

    const response = await fetch('http://localhost:3001/scheduled-posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ideaId: existingIdeaId,
        date: post.date ?? post.start,
        description: post.description ?? null,
        status: post.status ?? 'NOT_STARTED',
      }),
    })

    if (!response.ok) {
      console.error(
        `Failed to import scheduled post for idea ${fallbackTitle || existingIdeaId}`,
        await response.text(),
      )
    } else {
      console.log(
        `Imported scheduled post for idea ${fallbackTitle || existingIdeaId} on ${
          (post.date ?? post.start)?.slice(0, 10) ?? 'unknown date'
        }`,
      )
    }
  }
}

importScheduledPosts().catch((error) => {
  console.error('Failed to import scheduled posts', error)
  process.exitCode = 1
})
