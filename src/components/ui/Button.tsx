import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const baseClasses = 'font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-4 focus:ring-gray-200',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-4 focus:ring-green-300',
    }

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
