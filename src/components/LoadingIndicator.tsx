import React from 'react';

export const LoadingIndicator = ({ updates }: { updates: string[] }) => {
  return (
    <div className="space-y-2 animate-pulse">
      {updates.map((update, i) => (
        <div key={i} className="text-sm text-gray-600">
          {update}
        </div>
      ))}
    </div>
  );
};
