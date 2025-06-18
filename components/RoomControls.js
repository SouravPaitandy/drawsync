import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RoomControls({ roomId }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [viewOnlyLink, setViewOnlyLink] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Create a view-only link by adding a parameter to the URL
  const generateViewOnlyLink = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', 'view');
      setViewOnlyLink(url.toString());
      setShowModal(true);
    }
    setIsMenuOpen(false);
  };
  
  // Leave the room and go back to home
  const leaveRoom = () => {
    router.push('/');
  };
  
  // Create a new room
  const createNewRoom = () => {
    const confirmed = window.confirm('Create a new drawing? You will leave the current room.');
    if (confirmed) {
      router.push('/');
    }
    setIsMenuOpen(false);
  };

  // Copy link to clipboard
  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
    setIsMenuOpen(false);
  };

  // Mobile dropdown menu
  if (isMobileView) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2 rounded-lg shadow-md"
          >
            <span className="text-sm font-medium">Menu</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          
          {isMenuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-lg shadow-lg p-2 w-48 border border-gray-200 dark:border-gray-700">
              <button
                onClick={leaveRoom}
                className="flex items-center w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                Exit Drawing
              </button>
              
              <button
                onClick={copyRoomLink}
                className="flex items-center w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                Copy Link
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(viewOnlyLink);
                  alert('View-Only Link copied to clipboard!');
                }}
                className="flex items-center w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                View-Only Link
              </button>
              
              <button
                onClick={createNewRoom}
                className="flex items-center w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Drawing
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-1.5 rounded-lg shadow-sm">
        <button
          onClick={leaveRoom}
          className="p-1.5 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
          title="Exit to home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Exit
        </button>
        
        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
        
        <button
          onClick={copyRoomLink}
          className="p-1.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 flex items-center"
          title="Copy room link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          Copy Link
        </button>
        
        <button
          onClick={generateViewOnlyLink}
          className="p-1.5 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
          title="Create view-only link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          View-Only Link
        </button>
        
        <button
          onClick={createNewRoom}
          className="p-1.5 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
          title="Create new drawing"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Drawing
        </button>
      </div>
      
      {/* View-Only Link Modal */}
      {showModal && (
        <div className="fixed top-28 inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              View-Only Link
            </h3>
            <div className="relative">
              <input 
                type="text" 
                value={viewOnlyLink}
                readOnly
                className="w-full p-2 pr-20 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(viewOnlyLink);
                  alert('Link copied to clipboard!');
                }}
                className="absolute right-1 top-1 bg-blue-500 text-white px-3 py-1 rounded text-sm"
              >
                Copy
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              Share this link with people you want to allow to view but not edit this drawing.
            </p>
            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}