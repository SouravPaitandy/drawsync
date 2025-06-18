'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { RoomProvider, useOthers } from '@/lib/liveblocks';
import DrawingCanvas from '@/components/DrawCanvas';
import Toolbar from '@/components/Toolbar';
import UserPanel from '@/components/UserPanel';
import ActivityFeed from '@/components/ActivityFeed';
import RoomControls from '@/components/RoomControls';
import ConnectionQualityIndicator from '@/components/ConnectionQualityIndicator';
import ConnectionWarning from '@/components/ConnectionWarning';
import { useParams, useSearchParams } from 'next/navigation';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Client/server hydration safety
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Only access these values client-side to prevent hydration issues
  const roomId = isClient ? params.roomId : null;
  const viewOnly = isClient ? searchParams.get('mode') === 'view' : false;
  
  const { theme, setTheme } = useTheme();
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState('pen');
  const [showHelp, setShowHelp] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  // Check if viewport is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Won't render anything meaningful during SSR
  if (!isClient || !roomId) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-gray-200 text-gray-900 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100 transition-colors duration-300 w-full h-full">
        <div className="flex items-center justify-center w-full h-screen">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-lg">Loading drawing board...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Share dialog component for sharing room URL
  const ShareDialog = () => {
    const shareableLink =
      typeof window !== "undefined" ? window.location.href : "";

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl max-w-md w-full">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
            Share this link to collaborate
          </h3>
          <div className="relative">
            <input
              type="text"
              value={shareableLink}
              readOnly
              className="w-full p-2 pr-16 md:pr-20 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareableLink);
                alert("Link copied to clipboard!");
              }}
              className="absolute right-1 top-1 bg-blue-500 text-white px-2 md:px-3 py-1 rounded text-sm"
            >
              Copy
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            Anyone with this link can join and draw on your canvas in real time.
          </p>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowShareDialog(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{ cursor: null, name: null, color: null }}
    >
      <main className="bg-gradient-to-b from-gray-50 to-gray-200 text-gray-900 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100 transition-colors duration-300 w-full h-full">
        {/* Logo - Adjust size & position for mobile */}
        <div className={`fixed ${isMobileView ? 'top-3 left-3 scale-90' : 'top-4 left-4'} z-50 flex items-center`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 md:w-7 md:h-7 mr-1 md:mr-2 text-blue-600 dark:text-blue-400"
          >
            <path
              fillRule="evenodd"
              d="M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H15a6.75 6.75 0 010 13.5h-3a.75.75 0 010-1.5h3a5.25 5.25 0 100-10.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z"
              clipRule="evenodd"
            />
          </svg>
          <h1 className={`${isMobileView ? 'text-lg' : 'text-2xl'} font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-transparent bg-clip-text`}>
            DrawSync
          </h1>
        </div>

        {/* Room Controls */}
        {!viewOnly && <RoomControls roomId={roomId} />}

        {/* Collaboration Status - Hide on mobile */}
        {!isMobileView && (
          <div className="fixed top-4 right-42 -translate-x-1/2 z-50 flex items-center gap-2">
            <div className="flex items-center gap-2 p-2">
              <CollaborationStatus />
            </div>
          </div>
        )}

        {/* Help & Theme Buttons - Adjust for mobile */}
        <div className={`fixed ${isMobileView ? 'top-3 right-3 space-x-1' : 'top-4 right-4 space-x-2'} z-50 flex items-center`}>
          {/* Help Button */}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`flex items-center p-1.5 md:p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700`}
            aria-label="Help"
            title="Help"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 md:w-5 md:h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
            {!isMobileView && <span className="ml-1">Help</span>}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`flex items-center p-1.5 md:p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700`}
            aria-label="Toggle theme"
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 md:w-5 md:h-5 dark:hidden"
            >
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 md:w-5 md:h-5 hidden dark:block"
            >
              <path
                fillRule="evenodd"
                d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
                clipRule="evenodd"
              />
            </svg>
            {!isMobileView && (
              <span className="ml-1">{theme === "dark" ? "Light" : "Dark"}</span>
            )}
          </button>
        </div>

        {/* Help Panel - Adjust for mobile */}
        {showHelp && (
          <div className="fixed top-16 md:top-20 left-0 right-0 md:left-1/3 mx-auto max-w-sm md:max-w-lg z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-lg shadow-lg p-3 md:p-4 m-2 md:m-0 animate-fadeIn">
            <div className="flex justify-between items-center mb-2 md:mb-3">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">
                How to use DrawSync
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 md:h-6 md:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-1 md:mb-2">
                  Tools
                </h3>
                <ul className="list-disc list-inside space-y-0.5 md:space-y-1 text-xs md:text-sm">
                  <li>
                    <strong>Free Draw</strong>: Draw freely with smooth curves
                  </li>
                  <li>
                    <strong>Eraser</strong>: Click to erase entire strokes
                  </li>
                  <li>
                    <strong>Line</strong>: Draw straight lines between two
                    points
                  </li>
                  <li>
                    <strong>Rectangle</strong>: Create rectangular shapes
                  </li>
                  <li>
                    <strong>Ellipse</strong>: Create circular or oval shapes
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-1 md:mb-2">
                  Keyboard Shortcuts
                </h3>
                <ul className="list-disc list-inside space-y-0.5 md:space-y-1 text-xs md:text-sm">
                  <li>
                    <strong>Ctrl+Z</strong>: Undo last action
                  </li>
                  <li>
                    <strong>Ctrl+Y</strong>: Redo last undone action
                  </li>
                  <li>
                    <strong>Space</strong>: Hold to pan the canvas
                  </li>
                  <li>
                    <strong>Escape</strong>: Cancel current drawing
                  </li>
                  <li>
                    <strong>Ctrl+S</strong>: Export canvas as PNG
                  </li>
                  <li>
                    <strong>Ctrl+R</strong>: Reset view (zoom and position)
                  </li>
                  <li>
                    <strong>E</strong>: Switch to eraser tool
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Tip: Use keyboard shortcuts for faster workflow. Changes are
                synced in real-time with all collaborators.
              </p>
            </div>
          </div>
        )}

        {/* Toolbar Component */}
        {!viewOnly && (
          <Toolbar
            brushColor={brushColor}
            setBrushColor={setBrushColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            tool={tool}
            setTool={setTool}
          />
        )}

        {/* Drawing Canvas */}
        <div className="absolute top-0 left-0 w-full h-full">
          <DrawingCanvas
            brushColor={brushColor}
            brushSize={brushSize}
            tool={tool}
            viewOnly={viewOnly}
          />
        </div>

        {/* User Panel - Hide on mobile or display in a more compact way */}
        {!isMobileView && <UserPanel />}

        {/* Activity Feed - Hide on mobile or show minimized */}
        {!isMobileView && <ActivityFeed />}

        {/* View-Only Indicator */}
        {viewOnly && (
          <div className="fixed top-28 md:top-8 left-1/2 -translate-x-1/2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs md:text-sm rounded-full px-2 md:px-3 py-0.5 md:py-1 z-50">
            View-Only Mode
          </div>
        )}

        {/* Share Dialog */}
        {showShareDialog && <ShareDialog />}

        {/* Connection quality indicator and warning */}
        <ConnectionQualityIndicator />
        <ConnectionWarning />
        
        {/* Mobile users count - Show only on mobile */}
        {isMobileView && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-blue-100/80 dark:bg-blue-900/50 backdrop-blur-sm text-xs rounded-full py-0.5 px-2 text-blue-800 dark:text-blue-200">
            <MobileCollaborationStatus />
          </div>
        )}
      </main>
    </RoomProvider>
  );
}

// Regular collaboration status component
function CollaborationStatus() {
  const others = useOthers();

  return (
    <div className="flex items-center">
      <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
      <span className="text-xs font-medium mr-2">Connected</span>
      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
        {others.length + 1} user{others.length === 0 ? "" : "s"}
      </span>
    </div>
  );
}

// More compact mobile version
function MobileCollaborationStatus() {
  const others = useOthers();

  return (
    <div className="flex items-center">
      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></div>
      <span>{others.length + 1} user{others.length === 0 ? "" : "s"}</span>
    </div>
  );
}
