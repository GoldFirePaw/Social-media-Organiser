import { Card } from './reusableComponents/Card'
import { useIdeas } from '../hooks/useIdeas'
import { deleteIdeas } from '../api/deleteIdeas'
import { Tag } from './reusableComponents/Tag'
import s from './DisplayIdeas.module.css'
import { CloseButton } from './reusableComponents/CloseButton'
import type { Idea } from '../api/getIdeas'

type DisplayIdeasProps = {
  onIdeaSelect: (idea: Idea) => void
}

export function DisplayIdeas({ onIdeaSelect }: DisplayIdeasProps) {
  const { ideas, error, refresh } = useIdeas()

  const handleDeleteIdeas = async (id: string) => {
    try {
      await deleteIdeas(id)
      await refresh()
    } catch (error) {
      console.error('Error deleting idea:', error)
    }
  }

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, idea: Idea) => {
    event.dataTransfer.setData('application/idea-id', idea.id)
    event.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <Card title="Display Ideas Component">
      {error && <p>{error}</p>}
      <div className={s.ideasContainer}>
        {!error &&
          ideas.map((idea) => (
            <div
              className={s.idea}
              key={idea.id}
              draggable
              onDragStart={(event) => handleDragStart(event, idea)}
              onClick={() => onIdeaSelect(idea)}
            >
              <h3>{idea.title}</h3>
              <Tag color={idea.platform === 'BOOKTOK' ? 'blue' : 'pink'} label={idea.platform} />
              <CloseButton
                onClick={(event) => {
                  event.stopPropagation()
                  handleDeleteIdeas(idea.id)
                }}
              />
            </div>
          ))}
      </div>
    </Card>
  )
}
