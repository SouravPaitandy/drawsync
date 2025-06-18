import { useState, useCallback } from 'react';

export default function useTouchEvents(callbacks) {
  const { onStart, onMove, onEnd } = callbacks;
  const [activeTouch, setActiveTouch] = useState(null);
  const [lastPosition, setLastPosition] = useState(null);
  
  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    // Don't prevent default here as it can break scrolling
    if (activeTouch) return;
    
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();
    
    // Save the touch identifier to track this touch across events
    setActiveTouch(touch.identifier);
    
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;
    
    // Store the position for distance calculations
    setLastPosition({ x: offsetX, y: offsetY });
    
    // Create a synthetic event with correct coordinates relative to the canvas
    const syntheticEvent = {
      nativeEvent: {
        offsetX,
        offsetY,
        button: 0, // Simulate left mouse button
        shiftKey: e.shiftKey || false
      },
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
      button: 0,
      touches: e.touches,
      targetTouches: e.targetTouches
    };
    
    onStart(syntheticEvent);
  }, [activeTouch, onStart]);
  
  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    e.preventDefault(); // Prevent scrolling during drawing
    if (activeTouch === null) return;
    
    // Find the active touch
    let activeIdx = -1;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouch) {
        activeIdx = i;
        break;
      }
    }
    
    if (activeIdx === -1) return;
    
    const touch = e.changedTouches[activeIdx];
    const rect = e.target.getBoundingClientRect();
    
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;
    
    // Create a synthetic event with correct coordinates
    const syntheticEvent = {
      nativeEvent: {
        offsetX,
        offsetY,
        button: 0,
        shiftKey: e.shiftKey || false
      },
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
      touches: e.touches,
      targetTouches: e.targetTouches
    };
    
    // Update last position regardless of distance threshold
    setLastPosition({ x: offsetX, y: offsetY });
    
    onMove(syntheticEvent);
  }, [activeTouch, onMove]);
  
  // Handle touch end
  const handleTouchEnd = useCallback((e) => {
    // Don't prevent default to allow other interactions afterward
    if (activeTouch === null) return;
    
    // Find if our active touch ended
    let found = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouch) {
        found = true;
        break;
      }
    }
    
    if (found) {
      setActiveTouch(null);
      setLastPosition(null);
      onEnd();
    }
  }, [activeTouch, onEnd]);
  
  // Handle touch cancel (e.g., when system UI appears)
  const handleTouchCancel = useCallback((e) => {
    if (activeTouch === null) return;
    
    let found = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouch) {
        found = true;
        break;
      }
    }
    
    if (found) {
      setActiveTouch(null);
      setLastPosition(null);
      onEnd();
    }
  }, [activeTouch, onEnd]);
  
  // Multi-touch gesture detection for pinch-zoom
  const handleTouchGesture = useCallback((e) => {
    if (e.touches.length !== 2) return null; // Only handle 2-finger gestures
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    
    // Calculate distance between touch points
    const distance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    return {
      center: {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      },
      distance
    };
  }, []);
  
  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    handleTouchGesture
  };
}