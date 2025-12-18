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
      difficulty: 2,
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
        <label className={s.formControl}>
          <span>Title</span>
          <input
            type="text"
            placeholder="Book review, dev tip…"
            className={s.input}
            {...register('title', { required: 'A title is required' })}
          />
          {errors.title && <p className={s.error}>{errors.title.message}</p>}
        </label>

        <label className={s.formControl}>
          <span>Description</span>
          <textarea
            placeholder="Optional context, bullet list, or notes"
            rows={4}
            className={s.textarea}
            {...register('description')}
          />
        </label>

        <div className={s.formGrid}>
          <label className={s.formControl}>
            <span>Platform</span>
            <select className={s.select} {...register('platform')}>
              <option value="BOOKTOK">BookTok</option>
              <option value="DEVTOK">DevTok</option>
            </select>
          </label>

          <label className={s.formControl}>
            <span>Difficulty</span>
            <select className={s.select} {...register('difficulty', { valueAsNumber: true })}>
              <option value={1}>Easy (1)</option>
              <option value={2}>Medium (2)</option>
              <option value={3}>Hard (3)</option>
            </select>
          </label>
        </div>

        <div className={s.formActions}>
          {isSubmitSuccessful && <span className={s.success}>Idea added!</span>}
          <button type="submit" className={s.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Add idea'}
          </button>
        </div>
      </form>
    </Card>
  )
}
