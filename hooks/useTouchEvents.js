import { useState, useCallback } from 'react';

export default function useTouchEvents(callbacks) {
  const { onStart, onMove, onEnd } = callbacks;
  const [activeTouch, setActiveTouch] = useState(null);
  
  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    if (activeTouch) return;
    
    const touch = e.touches[0];
    setActiveTouch(touch.identifier);
    
    // Create a synthetic event for onStart
    const syntheticEvent = {
      nativeEvent: {
        offsetX: touch.clientX,
        offsetY: touch.clientY,
        button: 0 // Simulate left mouse button
      },
      preventDefault: () => e.preventDefault()
    };
    
    onStart(syntheticEvent);
  }, [activeTouch, onStart]);
  
  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    if (!activeTouch) return;
    
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
    
    // Create a synthetic event for onMove
    const syntheticEvent = {
      nativeEvent: {
        offsetX: touch.clientX,
        offsetY: touch.clientY
      },
      preventDefault: () => e.preventDefault()
    };
    
    onMove(syntheticEvent);
  }, [activeTouch, onMove]);
  
  // Handle touch end
  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    if (!activeTouch) return;
    
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
      onEnd();
    }
  }, [activeTouch, onEnd]);
  
  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}