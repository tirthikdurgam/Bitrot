import { ReactNode } from "react"

interface SocialButtonProps {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}

export function SocialButton({ icon, label, onClick, disabled }: SocialButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded-xl transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="w-5 h-5 text-white/90 group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="font-inter font-medium text-sm text-white/80 group-hover:text-white">
        {label}
      </span>
    </button>
  )
}