import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, name, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-okabe-ito-vermillion ml-1">*</span>}
          </label>
        )}
        <input
          id={name}
          ref={ref}
          className={`w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-okabe-ito-blue focus:border-transparent focus:outline-none ${
            error ? 'border-okabe-ito-vermillion' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-okabe-ito-vermillion">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
