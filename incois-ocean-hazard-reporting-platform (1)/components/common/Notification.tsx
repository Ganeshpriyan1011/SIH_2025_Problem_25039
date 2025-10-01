import React, { useEffect } from 'react';

export interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
          icon: 'checkmark-circle-outline',
          border: 'border-emerald-200'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-pink-500',
          icon: 'close-circle-outline',
          border: 'border-red-200'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-orange-500 to-yellow-500',
          icon: 'warning-outline',
          border: 'border-orange-200'
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-cyan-500 to-blue-500',
          icon: 'information-circle-outline',
          border: 'border-cyan-200'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
          icon: 'information-circle-outline',
          border: 'border-gray-200'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={`
      fixed top-4 right-4 z-50 
      bg-white/95 backdrop-blur-lg 
      border ${styles.border} 
      rounded-2xl shadow-2xl 
      p-4 min-w-80 max-w-md
      transform transition-all duration-300 ease-out
      animate-slide-in-right
    `}>
      <div className="flex items-start space-x-3">
        <div className={`
          ${styles.bg} 
          rounded-full p-2 flex-shrink-0
          shadow-lg
        `}>
          <ion-icon 
            name={styles.icon} 
            className="text-white text-xl"
          ></ion-icon>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-800 mb-1">
            {title}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>
        
        <button
          onClick={() => onClose(id)}
          className="
            flex-shrink-0 p-1 
            text-gray-400 hover:text-gray-600 
            transition-colors duration-200
            rounded-full hover:bg-gray-100
          "
        >
          <ion-icon name="close-outline" className="text-lg"></ion-icon>
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${styles.bg} animate-progress`}
          style={{
            animation: `progress ${duration}ms linear forwards`
          }}
        ></div>
      </div>
    </div>
  );
};

export default Notification;
