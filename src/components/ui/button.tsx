'use client';

/**
 * Button - Reusable button primitive with consistent styling.
 */

import { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'gradient';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Icon to show before text */
  icon?: React.ReactNode;
  /** Icon to show after text */
  iconRight?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-blue hover:bg-accent-blue/80 text-white shadow-glow-blue/50 hover:shadow-glow-blue',
  secondary:
    'bg-github-bg text-github-text-secondary hover:bg-github-elevated hover:text-github-text border border-github-border',
  danger:
    'bg-accent-pink/20 hover:bg-accent-pink/30 text-accent-pink border border-accent-pink/30',
  ghost:
    'text-github-text-secondary hover:text-github-text hover:bg-github-elevated',
  gradient:
    'bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue/80 hover:to-accent-purple/80 text-white shadow-glow-blue/50 hover:shadow-glow-purple',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      icon,
      iconRight,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center gap-1.5 
          rounded-md font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {icon}
        {children}
        {iconRight}
      </button>
    );
  }
);

Button.displayName = 'Button';
