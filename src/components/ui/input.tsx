'use client';

/**
 * Input - Reusable form input primitive with consistent styling.
 */

import { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text */
  label?: string;
  /** Helper text below input */
  helper?: string;
  /** Error message (shows in red) */
  error?: string;
  /** Accent color for focus ring */
  accentColor?: 'blue' | 'green' | 'orange' | 'pink';
}

const accentClasses: Record<string, string> = {
  blue: 'focus:border-accent-blue focus:ring-accent-blue',
  green: 'focus:border-accent-green focus:ring-accent-green',
  orange: 'focus:border-accent-orange focus:ring-accent-orange',
  pink: 'focus:border-accent-pink focus:ring-accent-pink',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helper, error, accentColor = 'blue', className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-xs font-semibold text-github-text-secondary uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-github-bg border border-github-border rounded-md 
            px-3 py-2 text-sm text-github-text 
            focus:outline-none focus:ring-1 transition-all
            placeholder:text-github-text-muted
            ${accentClasses[accentColor]}
            ${error ? 'border-accent-pink focus:border-accent-pink focus:ring-accent-pink' : ''}
            ${className}
          `}
          {...props}
        />
        {helper && !error && (
          <p className="text-[10px] text-github-text-muted">{helper}</p>
        )}
        {error && <p className="text-[10px] text-accent-pink">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea variant
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
  accentColor?: 'blue' | 'green' | 'orange' | 'pink';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helper, error, accentColor = 'blue', className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-xs font-semibold text-github-text-secondary uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full bg-github-bg border border-github-border rounded-md 
            px-3 py-2 text-sm text-github-text resize-none
            focus:outline-none focus:ring-1 transition-all
            placeholder:text-github-text-muted
            ${accentClasses[accentColor]}
            ${error ? 'border-accent-pink focus:border-accent-pink focus:ring-accent-pink' : ''}
            ${className}
          `}
          {...props}
        />
        {helper && !error && (
          <p className="text-[10px] text-github-text-muted">{helper}</p>
        )}
        {error && <p className="text-[10px] text-accent-pink">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Checkbox with label
 */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = '', ...props }, ref) => {
    return (
      <div className={`flex items-start p-3 bg-github-bg/50 border border-github-border rounded-md ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          className="w-4 h-4 mt-0.5 text-accent-blue bg-github-bg border-github-border rounded focus:ring-accent-blue focus:ring-2 cursor-pointer"
          {...props}
        />
        <div className="ml-2">
          <label className="text-sm font-medium text-github-text cursor-pointer">
            {label}
          </label>
          {description && (
            <p className="text-xs text-github-text-secondary mt-0.5">{description}</p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
