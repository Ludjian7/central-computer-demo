import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="w-full h-full p-4 space-y-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-8 bg-gray-200 rounded w-5/6"></div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
        <div className="h-8 bg-gray-200 rounded w-4/5"></div>
      </div>
    </div>
  );
}
