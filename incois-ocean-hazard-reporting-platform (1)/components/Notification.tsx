import React, { useEffect, useState } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Enter animation
    setShow(true);

    // Auto-close after a delay
    const timer = setTimeout(() => {
      setShow(false);
    }, 3500); // Start fade-out before onClose is called in App.tsx

    return () => clearTimeout(timer);
  }, [message, type]); // Reruns when a new message comes in

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const iconName = type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline';

  return (
    <div 
      className={`fixed top-5 right-5 z-[100] flex items-center p-4 rounded-lg text-white shadow-lg transition-all duration-300 ease-in-out ${bgColor} ${show ? 'transform translate-x-0 opacity-100' : 'transform translate-x-full opacity-0'}`}
    >
      {/* FIX: Replaced 'class' with 'className' to align with React's JSX syntax. */}
      <ion-icon name={iconName} className="text-2xl mr-3"></ion-icon>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={() => setShow(false)} className="ml-4 text-white/80 hover:text-white">
        {/* FIX: Replaced 'class' with 'className' to align with React's JSX syntax. */}
        <ion-icon name="close-outline" className="text-xl"></ion-icon>
      </button>
    </div>
  );
};

export default Notification;