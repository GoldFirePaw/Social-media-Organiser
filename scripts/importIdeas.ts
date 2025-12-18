const fs = require('node:fs/promises')

async function importIdeas() {
  const ideas = JSON.parse(await fs.readFile('backend/ideas-export.json', 'utf8'))

  for (const idea of ideas) {
    const response = await fetch('http://localhost:3001/ideas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: idea.title,
        description: idea.description,
        platform: idea.platform,
        difficulty: idea.difficulty ?? 2,
      }),
    })

    if (!response.ok) {
      console.error(`Failed to import idea "${idea.title}"`, await response.text())
    } else {
      console.log(`Imported idea "${idea.title}"`)
    }
  }
}

importIdeas().catch((error) => {
  console.error('Failed to import ideas', error)
  process.exitCode = 1
})
