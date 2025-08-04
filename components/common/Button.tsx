import { ButtonHTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: ReactNode;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  icon,
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-bold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group';

  const variants = {
    primary:
      'text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 focus:ring-orange-200/50 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:translate-y-0',
    secondary:
      'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 focus:ring-gray-200/50 border border-gray-200 shadow-md hover:shadow-lg',
    outline:
      'border-2 border-orange-500 bg-transparent text-orange-500 hover:bg-orange-50 focus:ring-orange-200/50 shadow-md hover:shadow-lg',
    ghost:
      'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-200/50',
  };

  const sizes = {
    sm: 'px-6 py-3 text-sm min-h-[44px]',
    md: 'px-8 py-4 text-base min-h-[56px]',
    lg: 'px-12 py-6 text-lg min-h-[68px]',
  };

  return (
    <button
      className={classNames(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Content */}
      <div className="relative z-10 flex items-center gap-3">
        {icon && (
          <span className="text-xl group-hover:scale-110 transition-transform duration-200">
            {icon}
          </span>
        )}
        <span className="group-hover:scale-105 transition-transform duration-200">
          {children}
        </span>
      </div>
    </button>
  );
}
