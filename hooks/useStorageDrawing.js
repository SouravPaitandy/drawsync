import { useState, useEffect } from 'react';
import { useStorage, useMutation } from '@/lib/liveblocks';

export function useStorageDrawing() {
  // Get the current state of the drawing from storage
  const storageDrawHistory = useStorage((root) => root.drawHistory) || [];
  const storageRedoStack = useStorage((root) => root.redoStack) || [];
  const lastUpdate = useStorage((root) => root.lastUpdate);
  
  // Local state synchronized with storage
  const [drawHistory, setDrawHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize local state from storage
  useEffect(() => {
    if (storageDrawHistory && !isInitialized) {
      setDrawHistory(storageDrawHistory);
      setRedoStack(storageRedoStack || []);
      setIsInitialized(true);
    }
  }, [storageDrawHistory, storageRedoStack, isInitialized]);

  // Keep local state in sync with storage
  useEffect(() => {
    if (isInitialized && lastUpdate) {
      setDrawHistory(storageDrawHistory);
      setRedoStack(storageRedoStack || []);
    }
  }, [storageDrawHistory, storageRedoStack, lastUpdate, isInitialized]);

  // ======== MUTATIONS ========
  
  // Add a stroke to the drawing
  const addStroke = useMutation(({ storage }, stroke) => {
    const currentHistory = storage.get('drawHistory') || [];
    const updatedHistory = [...currentHistory, stroke];
    
    storage.set('drawHistory', updatedHistory);
    storage.set('redoStack', []); // Clear redo stack
    storage.set('lastUpdate', new Date().toISOString());
  }, []);

  // Erase a stroke from the drawing
  const eraseStroke = useMutation(({ storage }, strokeIndex) => {
    const currentHistory = storage.get('drawHistory') || [];
    const updatedHistory = [...currentHistory];
    updatedHistory.splice(strokeIndex, 1);
    
    storage.set('drawHistory', updatedHistory);
    storage.set('lastUpdate', new Date().toISOString());
  }, []);

  // Clear all strokes
  const clearCanvas = useMutation(({ storage }) => {
    storage.set('drawHistory', []);
    storage.set('redoStack', []);
    storage.set('lastUpdate', new Date().toISOString());
  }, []);

  // Undo the last action
  const undoAction = useMutation(({ storage }) => {
    const currentHistory = storage.get('drawHistory') || [];
    const currentRedoStack = storage.get('redoStack') || [];
    
    if (currentHistory.length === 0) return;
    
    const lastStroke = currentHistory[currentHistory.length - 1];
    const updatedHistory = currentHistory.slice(0, -1);
    const updatedRedoStack = [...currentRedoStack, lastStroke];
    
    storage.set('drawHistory', updatedHistory);
    storage.set('redoStack', updatedRedoStack);
    storage.set('lastUpdate', new Date().toISOString());
  }, []);

  // Redo the last undone action
  const redoAction = useMutation(({ storage }) => {
    const currentHistory = storage.get('drawHistory') || [];
    const currentRedoStack = storage.get('redoStack') || [];
    
    if (currentRedoStack.length === 0) return;
    
    const strokeToRestore = currentRedoStack[currentRedoStack.length - 1];
    const updatedHistory = [...currentHistory, strokeToRestore];
    const updatedRedoStack = currentRedoStack.slice(0, -1);
    
    storage.set('drawHistory', updatedHistory);
    storage.set('redoStack', updatedRedoStack);
    storage.set('lastUpdate', new Date().toISOString());
  }, []);

  return {
    drawHistory,
    redoStack,
    addStroke,
    eraseStroke,
    clearCanvas,
    undoAction,
    redoAction,
    isLoaded: isInitialized,
  };
}