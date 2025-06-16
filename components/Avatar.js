"use client";

import { useState, useEffect } from 'react';

export function Avatar({ name, color, isCurrentUser }) {
  // Use state to handle the initial, with a consistent default
  const [initial, setInitial] = useState('?');
  
  // Only update the initial on the client side after component mounts
  useEffect(() => {
    if (name) {
      setInitial(name.charAt(0).toUpperCase());
    }
  }, [name]);
  
  // Use a consistent default color to prevent hydration mismatch
  const avatarColor = color || "#888888";
  
  return (
    <div 
      className={`relative flex items-center justify-center text-white text-sm font-medium w-8 h-8 rounded-full 
        ${isCurrentUser ? 'ring-2 ring-white dark:ring-gray-800' : ''}`}
      style={{ backgroundColor: avatarColor }}
    >
      {initial}
      {isCurrentUser && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
      )}
    </div>
  );
}