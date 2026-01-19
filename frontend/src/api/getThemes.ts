export type Theme = {
  id: string
  name: string
  usageCount: number
}

export const getThemes = async (): Promise<Theme[]> => {
  const response = await fetch('/api/themes')
  if (!response.ok) {
    throw new Error('Failed to fetch themes')
  }
  return response.json()
}
