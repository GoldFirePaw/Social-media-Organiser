import type { ReactNode } from 'react'
import s from './Card.module.css'

type CardProps = {
  title: string
  children?: ReactNode
  actions?: ReactNode
  className?: string
}

export function Card({ title, children, actions, className }: CardProps) {
  return (
    <section className={[s.card, className].filter(Boolean).join(' ')}>
      <div className={s.header}>
        <h2 className={s.title}>{title}</h2>
        {actions && <div className={s.actions}>{actions}</div>}
      </div>
      <div className={s.content}>{children}</div>
    </section>
  )
}
