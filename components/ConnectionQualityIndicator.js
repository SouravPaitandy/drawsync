"use client";

import { useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function ConnectionQualityIndicator() {
  const [isClient, setIsClient] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('checking');
  const [displayPing, setDisplayPing] = useState(null);
  
  // Get network status but only use it after client-side hydration
  const networkStatus = useNetworkStatus();
  
  useEffect(() => {
    setIsClient(true);
    
    // Now it's safe to use the values from the hook
    if (networkStatus) {
      setConnectionQuality(networkStatus.connectionQuality);
      setDisplayPing(networkStatus.pingTime || networkStatus.averagePing);
    }
  }, [networkStatus]);

  // Update values when networkStatus changes (after initial hydration)
  useEffect(() => {
    if (isClient && networkStatus) {
      setConnectionQuality(networkStatus.connectionQuality);
      setDisplayPing(networkStatus.pingTime || networkStatus.averagePing);
    }
  }, [isClient, networkStatus]);

  const getIndicatorColor = () => {
    switch (connectionQuality) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-green-400';
      case 'fair':
        return 'bg-yellow-400';
      case 'poor':
        return 'bg-orange-500';
      case 'offline':
      case 'error':
        return 'bg-red-500';
      case 'connecting':
      case 'checking':
      default:
        return 'bg-blue-400 animate-pulse';
    }
  };

  const getConnectionLabel = () => {
    switch (connectionQuality) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      case 'offline':
        return 'Offline';
      case 'error':
        return 'Error';
      case 'connecting':
        return 'Connecting';
      case 'checking':
      default:
        return 'Checking';
    }
  };

  // Don't render anything during server-side rendering
  if (!isClient) {
    return null;
  }

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
        title="Show connection quality"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v9.375c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v4.875c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 18v-4.875z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`flex items-center rounded-full px-2 py-1 ${isExpanded ? 'bg-white dark:bg-gray-800 shadow-md' : ''}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {isExpanded ? (
          <>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getIndicatorColor()}`}></div>
              <div className="text-xs font-medium">
                <span>{getConnectionLabel()}</span>
                {displayPing && connectionQuality !== 'offline' && (
                  <span className="ml-1 text-gray-500 dark:text-gray-400">{displayPing}ms</span>
                )}
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                title="Hide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Signal strength bars */}
            <div className="ml-3 flex h-3 items-end space-x-px">
              <div className={`w-1 h-1 rounded-sm ${connectionQuality !== 'offline' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`w-1 h-2 rounded-sm ${['good', 'excellent', 'fair'].includes(connectionQuality) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`w-1 h-3 rounded-sm ${['excellent', 'good'].includes(connectionQuality) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`w-1 h-4 rounded-sm ${connectionQuality === 'excellent' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
            </div>
          </>
        ) : (
          <div 
            className="flex items-center justify-center rounded-full p-1.5 bg-white dark:bg-gray-800 shadow-md"
            title={`${getConnectionLabel()}${displayPing ? ` (${displayPing}ms)` : ''}`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${getIndicatorColor()}`}></div>
          </div>
        )}
      </div>
    </div>
  );
}