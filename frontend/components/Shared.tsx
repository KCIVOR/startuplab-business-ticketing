
import React from 'react';

export const Badge: React.FC<{ 
  children: React.ReactNode, 
  type?: 'success' | 'danger' | 'warning' | 'info' | 'neutral',
  className?: string 
}> = ({ children, type = 'neutral', className = '' }) => {
  const styles = {
    success: 'bg-[#56CCF2]/20 text-[#1F3A5F]',
    danger: 'bg-[#1F3A5F]/10 text-[#1F3A5F]',
    warning: 'bg-[#2F80ED]/15 text-[#1F3A5F]',
    info: 'bg-[#2F80ED]/15 text-[#2F80ED]',
    neutral: 'bg-[#F4F6F8] text-[#1F3A5F]/70',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[type]} ${className}`}>
      {children}
    </span>
  );
};

export const Card: React.FC<{ 
  children: React.ReactNode, 
  className?: string,
  onClick?: () => void 
}> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl shadow-sm border border-[#F4F6F8] overflow-hidden ${className}`}
  >
    {children}
  </div>
);

export const Button: React.FC<{ 
  children: React.ReactNode, 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger',
  size?: 'sm' | 'md' | 'lg',
  className?: string,
  disabled?: boolean,
  type?: 'button' | 'submit',
  onClick?: () => void 
}> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  type = 'button',
  onClick 
}) => {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#2F80ED] text-white hover:bg-[#1F3A5F] focus:ring-[#2F80ED]',
    secondary: 'bg-[#1F3A5F] text-white hover:bg-[#2F80ED] focus:ring-[#1F3A5F]',
    outline: 'border border-[#2F80ED]/30 text-[#1F3A5F] bg-white hover:bg-[#F4F6F8] focus:ring-[#2F80ED]',
    ghost: 'text-[#1F3A5F]/70 hover:bg-[#F4F6F8] focus:ring-[#56CCF2]',
    danger: 'bg-[#1F3A5F] text-white hover:bg-[#2F80ED] focus:ring-[#1F3A5F]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<{
  label?: string;
  error?: string;
  [key: string]: any;
}> = ({ label, error, ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="block text-sm font-medium text-[#1F3A5F]">{label}</label>}
    <input
      className={`block w-full px-3 py-2 bg-white border ${error ? 'border-[#2F80ED]' : 'border-[#F4F6F8]'} rounded-lg shadow-sm focus:outline-none focus:ring-2 ${error ? 'focus:ring-[#2F80ED]/40' : 'focus:ring-[#2F80ED]/40'} transition-all`}
      {...props}
    />
    {error && <p className="text-xs text-[#1F3A5F] mt-1">{error}</p>}
  </div>
);

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1F3A5F]/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
        <div className="px-6 py-4 border-b border-[#F4F6F8] flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-[#1F3A5F]">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-[#1F3A5F]/50 hover:text-[#1F3A5F] hover:bg-[#F4F6F8] rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const PageLoader: React.FC<{
  label?: string;
  variant?: 'page' | 'section';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({
  label = 'Loading content...',
  variant = 'section',
  size = 'md',
  className = ''
}) => {
  const variants = {
    page: 'min-h-screen bg-[#F4F6F8]',
    section: 'min-h-[60vh] bg-transparent'
  };

  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${variants[variant]} ${className}`}>
      <div className={`relative ${sizes[size]}`}>
        <div className="absolute inset-0 rounded-full border border-[#56CCF2]/35" />
        <div className="absolute inset-0 rounded-full border-2 border-[#2F80ED] border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full bg-[#2F80ED]/10" />
      </div>
      {label && (
        <p className="mt-4 text-[#1F3A5F]/60 font-black uppercase tracking-widest text-[9px]">
          {label}
        </p>
      )}
    </div>
  );
};
