import { forwardRef, type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost' | 'gradient'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: boolean
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    icon = false,
    fullWidth = false,
    children,
    ...props
  }, ref) => {
    const baseClasses = `
      inline-flex items-center justify-center
      font-medium rounded-xl
      transition-all duration-200 ease-in-out
      disabled:opacity-50 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-offset-2
      shadow-sm hover:shadow-md
      active:scale-[0.98]
      ${icon ? 'p-2' : ''}
      ${fullWidth ? 'w-full' : ''}
    `

    const variantClasses = {
      // Primary - Main action buttons with modern blue gradient
      primary: `
        bg-gradient-to-r from-blue-600 to-blue-700
        text-white border border-blue-600
        hover:from-blue-700 hover:to-blue-800
        focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        shadow-blue-200 hover:shadow-blue-300
      `,

      // Secondary - Gray buttons for secondary actions
      secondary: `
        bg-gradient-to-r from-gray-50 to-gray-100
        text-gray-700 border border-gray-300
        hover:from-gray-100 hover:to-gray-200
        focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
        shadow-gray-100 hover:shadow-gray-200
      `,

      // Success - Green buttons for positive actions
      success: `
        bg-gradient-to-r from-green-600 to-green-700
        text-white border border-green-600
        hover:from-green-700 hover:to-green-800
        focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        shadow-green-200 hover:shadow-green-300
      `,

      // Danger - Red buttons for destructive actions
      danger: `
        bg-gradient-to-r from-red-600 to-red-700
        text-white border border-red-600
        hover:from-red-700 hover:to-red-800
        focus:ring-2 focus:ring-red-500 focus:ring-offset-2
        shadow-red-200 hover:shadow-red-300
      `,

      // Outline - Clear bordered buttons
      outline: `
        bg-white text-gray-700 border-2 border-gray-300
        hover:bg-gray-50 hover:border-gray-400
        focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
      `,

      // Ghost - Minimal buttons for icon-only actions
      ghost: `
        bg-transparent text-gray-600 border border-transparent
        hover:bg-gray-100 hover:text-gray-900
        focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
        shadow-none hover:shadow-sm
      `,

      // Gradient - Special gradient for primary CTAs
      gradient: `
        bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600
        text-white border border-transparent
        hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700
        focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
        shadow-purple-200 hover:shadow-purple-300
        animate-gradient bg-size-200
      `
    }

    const sizeClasses = {
      xs: icon ? 'w-6 h-6 text-xs' : 'px-2 py-1 text-xs',
      sm: icon ? 'w-8 h-8 text-sm' : 'px-3 py-1.5 text-sm',
      md: icon ? 'w-10 h-10 text-base' : 'px-4 py-2 text-base',
      lg: icon ? 'w-12 h-12 text-lg' : 'px-6 py-3 text-lg',
      xl: icon ? 'w-14 h-14 text-xl' : 'px-8 py-4 text-xl',
    }

    return (
      <button
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {!icon && children}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {children}
          </span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
