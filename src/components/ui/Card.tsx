import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  children: React.ReactNode
}

export default function Card({ title, children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`} {...props}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
