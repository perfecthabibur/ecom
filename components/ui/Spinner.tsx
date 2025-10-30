
import React from 'react';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Spinner: React.FC<SpinnerProps> = ({ className = '', size = 'md' }) => {
  let spinnerSize = 'w-5 h-5';
  if (size === 'sm') spinnerSize = 'w-4 h-4';
  if (size === 'lg') spinnerSize = 'w-8 h-8';

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${spinnerSize} border-4 border-t-4 border-gray-200 dark:border-gray-600 border-t-primary rounded-full animate-spin`}
        role="status"
        aria-label="loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default Spinner;