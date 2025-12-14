import { Card } from './reusableComponents/Card'
import { useIdeas } from '../hooks/useIdeas'
import { deleteIdeas } from '../api/deleteIdeas'
import { Tag } from './reusableComponents/Tag'
import s from './DisplayIdeas.module.css'
import { CloseButton } from './reusableComponents/closeButton'

export function DisplayIdeas() {
  const { ideas, error, refresh } = useIdeas()
  const handleDeleteIdeas = async (id: string) => {
    try {
      await deleteIdeas(id)      
      await refresh()

    } catch (error) {
      console.error('Error deleting idea:', error)
    }
}

  return (
    <Card title="Display Ideas Component">
      {error && <p>{error}</p>}
      <div className={s.ideasContainer}>
      {!error &&
        ideas.map((idea) => (
            <div className={s.idea} key={idea.id}>
            <h3>{idea.title}</h3>
            <Tag color={idea.platform === 'BOOKTOK' ? 'blue' : 'pink'} label={idea.platform} />
            <CloseButton onClick={() => handleDeleteIdeas(idea.id)} />
          </div>
        ))}
        </div>
    </Card>
  )
}
