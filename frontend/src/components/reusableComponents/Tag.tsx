
import s from './Tag.module.css'

type TagProps = {
  label: string
  color: string
}

export const Tag: React.FC<TagProps> = ({ label, color }) => {
  return (
    <span className={`${s.tag} ${s[color] ?? ""}`}>
      {label}
    </span>
  )
}
