import { FC } from "react";

interface Prop {
  label: string
  handleClick?: () => void
}

const BaseTag: FC<Prop> = ({ label, handleClick }) => {
  return (
    <div 
      className={`p-0.5 bg-theme-bg-color inline-flex items-center rounded-full select-none`}
      onClick={handleClick}
    >
      <div className={`text-white text-xs font-light italic`}>{label}</div>
    </div>
  )
}

export default BaseTag;