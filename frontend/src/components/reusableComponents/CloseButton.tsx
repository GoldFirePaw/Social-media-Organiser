import type { MouseEventHandler } from 'react'
import s from './CloseButton.module.css'

type CloseButtonProps = {
  onClick: MouseEventHandler<HTMLButtonElement>
}

export const CloseButton = ({ onClick }: CloseButtonProps) => {
  return (
    <button aria-label="Close" onClick={onClick} className={s.closeButton}>
      &times;
    </button>
  )
}
