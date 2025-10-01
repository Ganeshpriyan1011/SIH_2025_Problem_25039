import React from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, className = '' }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" aria-modal="true" role="dialog">
      <div className={`bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-lg mx-4 ${className}`}>
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            {/* FIX: Replaced 'class' with 'className' to align with React's JSX syntax. */}
            <ion-icon name="close-outline" className="text-2xl"></ion-icon>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;