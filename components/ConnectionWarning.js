"use client";

import { useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function ConnectionWarning() {
  const [isClient, setIsClient] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasConnectivityIssues, setHasConnectivityIssues] = useState(false);
  const [connectionState, setConnectionState] = useState('connected');
  const [isOnline, setIsOnline] = useState(true);
  
  // Use the hook but only after client-side hydration
  const networkStatus = useNetworkStatus();
  
  useEffect(() => {
    setIsClient(true);
    
    if (networkStatus) {
      setConnectionState(networkStatus.connectionState);
      setIsOnline(networkStatus.isOnline);
    }
  }, [networkStatus]);
  
  // Update when network status changes
  useEffect(() => {
    if (isClient && networkStatus) {
      setConnectionState(networkStatus.connectionState);
      setIsOnline(networkStatus.isOnline);
    }
  }, [isClient, networkStatus]);
  
  // Monitor connection state
  useEffect(() => {
    if (!isClient) return; // Skip during server rendering
    
    if (!isOnline || connectionState === 'disconnected') {
      setIsVisible(true);
      setHasConnectivityIssues(true);
    } else if (connectionState === 'connecting') {
      setHasConnectivityIssues(true);
      
      // Only show the warning if it stays in connecting state for more than 3s
      const timer = setTimeout(() => {
        if (connectionState === 'connecting') {
          setIsVisible(true);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setHasConnectivityIssues(false);
      
      // Hide the warning after a delay when connection is restored
      if (isVisible) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [connectionState, isOnline, isVisible, isClient]);
  
  // Don't render anything during SSR
  if (!isClient) return null;
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 animate-fade-in">
      <div className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
        !isOnline || connectionState === 'disconnected'
          ? 'bg-red-500 text-white' 
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/60 dark:text-yellow-200'
      }`}>
        {!isOnline ? (
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zm1.586 2l.207.207a7.025 7.025 0 00-1.892 4.001 7 7 0 007.75 6.937l.452.453a8 8 0 01-9.602-7.89c0-1.537.432-2.98 1.185-4.211zm12.462 12.462A7.969 7.969 0 0018 14a8 8 0 00-8-8c-.79 0-1.557.114-2.274.324l1.441 1.441A7.011 7.011 0 0110 7a7 7 0 017 7c.405 0 .802-.034 1.186-.1l-.431-.431z" clipRule="evenodd" />
            </svg>
            <span>You are offline. Drawings won't be saved or shared until you reconnect.</span>
          </div>
        ) : connectionState === 'disconnected' ? (
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Connection lost. Trying to reconnect...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>Connection is unstable. Some changes may be delayed.</span>
          </div>
        )}
        
        <button 
          onClick={() => setIsVisible(false)}
          className="ml-3 text-sm text-white bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}