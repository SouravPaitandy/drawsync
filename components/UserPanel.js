"use client";

import { useState, useEffect } from "react";
import { useOthers, useMyPresence, useSelf } from "@/lib/liveblocks";
import { Avatar } from "./Avatar";

export default function UserPanel() {
  const others = useOthers();
  const [myPresence, updateMyPresence] = useMyPresence();
  const [isOpen, setIsOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const currentUser = useSelf();

  // To fix hydration issues, we'll use a state to track if we're client-side
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark that we're now on the client
    setIsClient(true);

    // Only run initialization on the client side
    initializeUser();
  }, []);

  const randomColors = [
    "#F44336",
    "#E91E63",
    "#9C27B0",
    "#673AB7",
    "#3F51B5",
    "#2196F3",
    "#00BCD4",
    "#009688",
    "#4CAF50",
    "#CDDC39",
    "#FFC107",
    "#FF9800",
    "#FF5722",
  ];

  // Set a random name and color on first load if not already set
  const initializeUser = () => {
    if (!myPresence.name) {
      const randomColor =
        randomColors[Math.floor(Math.random() * randomColors.length)];
      updateMyPresence({
        name: `User ${Math.floor(Math.random() * 10000)}`,
        color: randomColor,
      });
    }
  };

  const handleNameChange = (e) => {
    setNameInput(e.target.value);
  };

  const updateUserName = () => {
    if (nameInput.trim()) {
      updateMyPresence({ name: nameInput.trim() });
      setNameInput("");
      setIsOpen(false);
    }
  };

  // Only render others on client-side to avoid hydration mismatch
  const renderOthers = () => {
    if (!isClient) return null;

    return others.map(
      ({ connectionId, presence }) =>
        presence.name && (
          <Avatar
            key={connectionId}
            name={presence.name}
            color={presence.color || "#888888"}
          />
        )
    );
  };

  // Add a connection info section
  const ConnectionInfo = () => {
    const [networkInfo, setNetworkInfo] = useState({
      downlink: null,
      effectiveType: null,
      rtt: null,
    });

    useEffect(() => {
      // Check if Navigator Connection API is available
      if ("connection" in navigator) {
        const conn = navigator.connection;

        const updateNetworkInfo = () => {
          setNetworkInfo({
            downlink: conn.downlink,
            effectiveType: conn.effectiveType,
            rtt: conn.rtt,
          });
        };

        // Initial update
        updateNetworkInfo();

        // Listen for changes
        conn.addEventListener("change", updateNetworkInfo);

        return () => {
          conn.removeEventListener("change", updateNetworkInfo);
        };
      }
    }, []);

    return (
      <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
        <h4 className="font-medium mb-1 text-gray-700 dark:text-gray-300">
          Connection Details
        </h4>
        <div className="space-y-1">
          {networkInfo.effectiveType && (
            <div className="flex justify-between">
              <span>Network type:</span>
              <span className="font-mono">{networkInfo.effectiveType}</span>
            </div>
          )}
          {networkInfo.downlink && (
            <div className="flex justify-between">
              <span>Speed:</span>
              <span className="font-mono">{networkInfo.downlink} Mbps</span>
            </div>
          )}
          {networkInfo.rtt && (
            <div className="flex justify-between">
              <span>Latency (RTT):</span>
              <span className="font-mono">{networkInfo.rtt} ms</span>
            </div>
          )}
          {!networkInfo.effectiveType &&
            !networkInfo.downlink &&
            !networkInfo.rtt && (
              <div className="italic">Network information not available</div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed left-4 bottom-4 z-40">
      <div className="flex items-center gap-2">
        {/* Current user avatar - Only render on client */}
        {isClient && (
          <Avatar
            name={myPresence.name}
            color={myPresence.color}
            isCurrentUser
          />
        )}

        {/* Other users avatars */}
        <div className="flex -space-x-2">{renderOthers()}</div>

        {/* Total count badge when there are many users */}
        {isClient && others.length > 3 && (
          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full">
            +{others.length - 3} more
          </div>
        )}

        {/* Settings button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Settings panel */}
      {isOpen && (
        <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h3 className="text-sm font-medium mb-2">Your Identity</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder={myPresence.name || "Enter your name"}
              value={nameInput}
              onChange={handleNameChange}
              className="p-2 text-sm border rounded flex-grow dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              onClick={updateUserName}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Update
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {randomColors.map((color) => (
              <button
                key={color}
                onClick={() => updateMyPresence({ color })}
                className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                style={{
                  backgroundColor: color,
                  boxShadow:
                    myPresence.color === color
                      ? "0 0 0 2px white, 0 0 0 4px " + color
                      : "none",
                }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>

          {/* Connection Info */}
          <ConnectionInfo />
        </div>
      )}
    </div>
  );
}
