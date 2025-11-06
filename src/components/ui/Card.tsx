import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  children: React.ReactNode
}

export default function Card({ title, children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow ${className}`} {...props}>
      {title && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}
