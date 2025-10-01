
import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    }
    return (
        <div className={`animate-spin rounded-full border-t-2 border-b-2 border-sky-500 ${sizeClasses[size]}`}></div>
    );
}

export default Spinner;
