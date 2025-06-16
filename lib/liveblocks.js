import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

// Create a Liveblocks client with just the public key
const client = createClient({
  // Replace with your public key from the Liveblocks dashboard
  publicApiKey:  "pk_prod_BcTgHM2rsRJuSMzsKLezuLJUHPKrfoG0Ruz-isLD1ElhLLWkpEUIOHh-3BpYSZtw",
  
  // User info will be generated automatically with random IDs
  // You can add authentication later if needed
});

// Define the types for our room
export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useSelf,
  useOthers,
  useUpdateMyPresence,
  useBroadcastEvent,
  useEventListener,
  useStorage,
  useMutation,
} = createRoomContext(client);

// Types for our collaborative data
export const EVENT_TYPES = {
  ADD_STROKE: "ADD_STROKE",
  ERASE_STROKE: "ERASE_STROKE",
  CLEAR_CANVAS: "CLEAR_CANVAS",
  UNDO: "UNDO",
  REDO: "REDO",
};