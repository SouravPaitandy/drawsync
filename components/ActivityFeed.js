import { useEffect, useState } from 'react';
import { useOthers, useEventListener, useSelf } from '@/lib/liveblocks';
import { EVENT_TYPES } from '@/lib/liveblocks';

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const others = useOthers();
  const self = useSelf();

  // Listen for collaboration events
  useEventListener(({ event, connectionId }) => {
    const user = connectionId === self?.connectionId 
      ? { presence: self.presence } 
      : others.find(other => other.connectionId === connectionId);
    
    if (!user) return;

    const userName = user.presence.name || 'Anonymous';
    let activityText = '';
    let activityIcon = null;

    switch (event.type) {
      case EVENT_TYPES.ADD_STROKE:
        activityText = `added a ${event.stroke.tool} stroke`;
        activityIcon = 'pen';
        break;
      case EVENT_TYPES.ERASE_STROKE:
        activityText = 'erased a stroke';
        activityIcon = 'eraser';
        break;
      case EVENT_TYPES.CLEAR_CANVAS:
        activityText = 'cleared the canvas';
        activityIcon = 'trash';
        break;
      case EVENT_TYPES.UNDO:
        activityText = 'undid an action';
        activityIcon = 'undo';
        break;
      case EVENT_TYPES.REDO:
        activityText = 'redid an action';
        activityIcon = 'redo';
        break;
      default:
        return;
    }

    const newActivity = {
      id: Date.now(),
      text: activityText,
      icon: activityIcon,
      userName: userName,
      userColor: user.presence.color || '#888888',
      timestamp: new Date()
    };

    setActivities(prev => [newActivity, ...prev].slice(0, 20));  // Keep last 20 activities
  });

  // Also track user joins/leaves
  useEffect(() => {
    const handleUserChange = () => {
      // This will run whenever users join or leave
      // Implementation depends on how you track previous users
    };

    // Set up observer for user changes
    // (implementation would depend on how we store previous user state)

    return () => {
      // Cleanup
    };
  }, [others]);

  if (activities.length === 0 && isCollapsed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-xs w-full">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium">Activity Feed</h3>
          <div className="flex gap-1">
            <button 
              onClick={() => setActivities([])} 
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d={isCollapsed ? "M19.5 8.25l-7.5 7.5-7.5-7.5" : "M4.5 15.75l7.5-7.5 7.5 7.5"} />
              </svg>
            </button>
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="max-h-60 overflow-y-auto p-2">
            {activities.length > 0 ? (
              <ul className="space-y-2">
                {activities.map(activity => (
                  <li key={activity.id} className="flex items-center text-xs animate-fadeIn">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: activity.userColor }}>
                      {activity.userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{activity.userName}</span>
                    <span className="mx-1">{activity.text}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-auto whitespace-nowrap">
                      {formatTime(activity.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 py-4">
                No recent activity
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format timestamps
function formatTime(date) {
  const now = new Date();
  const diffSeconds = Math.floor((now - date) / 1000);
  
  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}