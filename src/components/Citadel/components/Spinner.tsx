import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div 
      data-testid="spinner"
      className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" 
    />
  );
};
