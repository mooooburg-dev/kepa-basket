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
    'font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  const variants = {
    primary:
      'text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-orange-200 floating-button',
    secondary: 
      'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-200 border border-gray-200',
    outline:
      'border-2 border-orange-500 bg-transparent text-orange-500 hover:bg-orange-50 focus:ring-orange-200',
    ghost:
      'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-200',
  };

  const sizes = {
    sm: 'px-5 py-3 text-sm min-h-[42px]',
    md: 'px-7 py-4 text-base min-h-[52px]',
    lg: 'px-10 py-5 text-lg min-h-[60px]',
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
      {icon && <span className="text-xl">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
