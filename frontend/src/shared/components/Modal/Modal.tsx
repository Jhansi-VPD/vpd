import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} bg-[#171717] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] bg-[#141414]">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#262626]"
          >
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh] text-zinc-300 text-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

