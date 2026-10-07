import React from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#141416] border-l border-zinc-800 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Drawer;

