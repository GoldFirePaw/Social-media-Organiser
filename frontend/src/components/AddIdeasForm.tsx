import { useForm } from 'react-hook-form'
import { postIdeas, type IdeaData } from '../api/postIdeas'
import { Card } from './reusableComponents/Card'
import { useIdeas } from '../hooks/useIdeas'
import s from './AddIdeasForm.module.css'

export function AddIdeasForm() {
  const { refresh } = useIdeas()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<IdeaData>({
    defaultValues: {
      title: '',
      description: '',
      platform: 'BOOKTOK',
    },
  })

  const onSubmit = handleSubmit(async (data) => {
    await postIdeas(data)
    await refresh()
    reset()
  })

  return (
    <Card title="Add new ideas">
      <form onSubmit={onSubmit} className={s.form}>
        <input
          type="text"
          placeholder="Title"
          {...register('title', { required: 'A title is required' })}
        />
        {errors.title && <p>{errors.title.message}</p>}

        <textarea
          placeholder="Description"
          {...register('description')}
        />
        <select {...register('platform')}>
          <option value="BOOKTOK">BookTok</option>
          <option value="DEVTOK">DevTok</option>
        </select>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Add Idea'}
        </button>
        {isSubmitSuccessful && <p>Idea added!</p>}
      </form>
    </Card>
  )
}
