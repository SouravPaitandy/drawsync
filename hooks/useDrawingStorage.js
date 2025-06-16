import { useStorage, useMutation } from '@/lib/liveblocks';

export function useDrawingStorage() {
  // Get the current state of the drawing from storage
  const drawHistory = useStorage(root => root.drawHistory || []);
  const redoStack = useStorage(root => root.redoStack || []);
  
  // Create mutation to add a stroke
  const addStroke = useMutation(({ storage }, stroke) => {
    const drawHistory = storage.get('drawHistory') || [];
    storage.set('drawHistory', [...drawHistory, stroke]);
    // Clear redo stack when adding a new stroke
    storage.set('redoStack', []);
  }, []);
  
  // Create mutation to erase a stroke
  const eraseStroke = useMutation(({ storage }, strokeIndex) => {
    const drawHistory = storage.get('drawHistory') || [];
    const newHistory = [...drawHistory];
    newHistory.splice(strokeIndex, 1);
    storage.set('drawHistory', newHistory);
  }, []);

  // Create mutation to clear canvas
  const clearCanvas = useMutation(({ storage }) => {
    storage.set('drawHistory', []);
    storage.set('redoStack', []);
  }, []);

  // Create mutation to undo last action
  const undoLastAction = useMutation(({ storage }) => {
    const drawHistory = storage.get('drawHistory') || [];
    const redoStack = storage.get('redoStack') || [];
    
    if (drawHistory.length === 0) return;
    
    const lastAction = drawHistory[drawHistory.length - 1];
    storage.set('redoStack', [...redoStack, lastAction]);
    storage.set('drawHistory', drawHistory.slice(0, -1));
  }, []);

  // Create mutation to redo last undone action
  const redoLastAction = useMutation(({ storage }) => {
    const drawHistory = storage.get('drawHistory') || [];
    const redoStack = storage.get('redoStack') || [];
    
    if (redoStack.length === 0) return;
    
    const lastUndoneAction = redoStack[redoStack.length - 1];
    storage.set('drawHistory', [...drawHistory, lastUndoneAction]);
    storage.set('redoStack', redoStack.slice(0, -1));
  }, []);

  return {
    drawHistory,
    redoStack,
    addStroke,
    eraseStroke,
    clearCanvas,
    undoLastAction,
    redoLastAction
  };
}