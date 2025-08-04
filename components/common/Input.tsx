import { InputHTMLAttributes, forwardRef } from 'react';
import classNames from 'classnames';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="w-full group">
        {label && (
          <label className="block text-sm font-bold text-gray-800 mb-3">
            {label}
          </label>
        )}
        <div className="relative">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm"></div>

          {leftIcon && (
            <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200 z-10">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={classNames(
              'w-full text-gray-800 placeholder-gray-500 rounded-2xl',
              'focus:outline-none transition-all duration-300',
              'text-lg font-medium relative z-10',
              'bg-white/90 backdrop-blur-sm border-2 border-gray-200',
              'hover:border-orange-300 focus:border-orange-500',
              'hover:bg-white focus:bg-white',
              'shadow-md hover:shadow-lg focus:shadow-xl',
              leftIcon ? 'pl-14' : 'pl-5',
              rightIcon ? 'pr-14' : 'pr-5',
              'py-5 min-h-[64px]',
              error ? 'border-red-300 focus:border-red-500' : '',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200 z-10">
              {rightIcon}
            </div>
          )}

          {/* Focus ring */}
          <div className="absolute inset-0 rounded-2xl ring-2 ring-orange-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
