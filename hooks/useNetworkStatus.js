"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRoom } from '@/lib/liveblocks';

export function useNetworkStatus() {
  const room = useRoom();
  const [connectionState, setConnectionState] = useState('connected');
  const [isOnline, setIsOnline] = useState(true);
  const [pingTime, setPingTime] = useState(null);
  const [connectionQuality, setConnectionQuality] = useState('checking');
  const [pingAttempts, setPingAttempts] = useState(0);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionState('disconnected');
      setConnectionQuality('offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Function to test network latency with multiple fallbacks
  const checkPing = useCallback(async () => {
    if (!isOnline) {
      setConnectionQuality('offline');
      return;
    }

    const startTime = performance.now();
    
    try {
      // Get a cachebuster parameter to ensure we don't get cached responses
      const cacheBuster = `?cache=${Date.now()}`;
      
      // Try multiple endpoints, starting with local, then CDNs
      const endpoints = [
        // Local endpoint check (if your app has a simple health check API)
        '/api/health',
        
        // Use your own domain as a ping test (will use relative URL)
        `${cacheBuster}`,
        
        // Try common CDNs as fallbacks (these are likely to be available and fast)
        'https://www.google.com/generate_204',
        'https://www.cloudflare.com/cdn-cgi/trace'
      ];
      
      // Try each endpoint until one succeeds
      for (let endpoint of endpoints) {
        try {
          // Use fetch with a timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch(endpoint, {
            method: 'HEAD', // Just get headers, we don't need content
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
            signal: controller.signal,
            // Using mode: 'no-cors' to avoid CORS issues, but it won't give useful response status
            mode: endpoint.startsWith('/') || endpoint.startsWith(`${cacheBuster}`) ? undefined : 'no-cors',
          });
          
          clearTimeout(timeoutId);
          
          // If we got a response, calculate latency
          const endTime = performance.now();
          const latency = Math.round(endTime - startTime);
          setPingTime(latency);
          
          // Reset attempts counter on success
          setPingAttempts(0);
          
          // Categorize connection quality
          if (latency < 100) {
            setConnectionQuality('excellent');
          } else if (latency < 300) {
            setConnectionQuality('good');
          } else if (latency < 600) {
            setConnectionQuality('fair');
          } else {
            setConnectionQuality('poor');
          }
          
          // Successfully pinged, so we're done
          return;
        } catch (error) {
          // This endpoint failed, try the next one
          continue;
        }
      }
      
      // If we get here, all endpoints failed
      throw new Error("All ping endpoints failed");
      
    } catch (error) {
      // Handle failure of all endpoints
      console.error('Network check failed:', error.message);
      setPingAttempts(prev => prev + 1);
      
      // After 3 failed attempts, consider the connection poor or offline
      if (pingAttempts >= 2) {
        setConnectionQuality('poor');
        if (pingAttempts >= 5) {
          setConnectionState('connecting'); // We're online according to browser but can't reach anything
        }
      }
    }
  }, [isOnline, pingAttempts]);

  // Monitor ping timing
  useEffect(() => {
    if (!isOnline) return;
    
    // Initial check
    checkPing();
    
    // Check every 10 seconds
    const pingInterval = setInterval(checkPing, 10000);
    
    return () => {
      clearInterval(pingInterval);
    };
  }, [isOnline, checkPing]);

  // Use Navigator Connection API if available
  useEffect(() => {
    if (!isOnline) return;
    if (!('connection' in navigator)) return;
    
    const connection = navigator.connection;
    
    const handleConnectionChange = () => {
      if (connection.downlink < 0.5) {
        setConnectionQuality('poor');
      } else if (connection.downlink < 1.5) {
        setConnectionQuality('fair');
      } else if (connection.downlink < 5) {
        setConnectionQuality('good');
      } else {
        setConnectionQuality('excellent');
      }
      
      // If we have high RTT, the connection is poor regardless of bandwidth
      if (connection.rtt > 500) {
        setConnectionQuality('poor');
      } else if (connection.rtt > 300) {
        setConnectionQuality('fair');
      }
    };
    
    // Initial check
    handleConnectionChange();
    
    // Listen for changes
    connection.addEventListener('change', handleConnectionChange);
    
    return () => {
      connection.removeEventListener('change', handleConnectionChange);
    };
  }, [isOnline]);

  // Look at recent ping history to smooth out connection quality
  const [recentPings, setRecentPings] = useState([]);
  
  useEffect(() => {
    if (pingTime) {
      setRecentPings(prev => {
        const newPings = [...prev, pingTime];
        if (newPings.length > 5) {
          return newPings.slice(-5); // Keep last 5 pings
        }
        return newPings;
      });
    }
  }, [pingTime]);

  return {
    connectionState,
    pingTime,
    connectionQuality,
    isOnline,
    // Add average ping over recent checks
    averagePing: recentPings.length > 0
      ? Math.round(recentPings.reduce((sum, ping) => sum + ping, 0) / recentPings.length)
      : null
  };
}