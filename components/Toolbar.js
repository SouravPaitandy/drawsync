'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Circle, Pen, RectangleHorizontal, Eraser } from 'lucide-react';

export default function Toolbar({ brushColor, setBrushColor, brushSize, setBrushSize, tool, setTool }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      
      // Auto-close sidebar on small screens
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Predefined color palette
  const colorPalette = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#00ffff', '#ff00ff', '#f28b82', '#fbbc04',
    '#fff475', '#ccff90', '#a7ffeb', '#cbf0f8', '#aecbfa',
    '#d7aefb', '#fdcfe8', '#e6c9a8', '#808080', '#4a4a4a'
  ];

  return (
    <>
      {/* Main Toolbar - Top Center - Tools Only */}
      <div className={`fixed left-1/2 transform -translate-x-1/2 ${isMobileView ? 'bottom-4' : 'top-16'} bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg z-40 px-3 py-1.5`}>
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={() => setTool('pen')}
            className={`p-1.5 md:p-2 rounded-md transition-colors ${tool === 'pen' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            title="Free Draw (P)"
          >
            <Pen className="w-4 h-4 md:w-5 md:h-5"/>
          </button>
          
          {/* Eraser Tool */}
          <button
            onClick={() => setTool('eraser')}
            className={`p-1.5 md:p-2 rounded-md transition-colors ${tool === 'eraser' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            title="Eraser (E)"
          >
            <Eraser className="w-4 h-4 md:w-5 md:h-5"/>
          </button>
          
          <button
            onClick={() => setTool('line')}
            className={`p-1.5 md:p-2 rounded-md transition-colors ${tool === 'line' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            title="Line (L)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            </svg>
          </button>
          
          <button
            onClick={() => setTool('rect')}
            className={`p-1.5 md:p-2 rounded-md transition-colors ${tool === 'rect' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            title="Rectangle (R)"
          >
            <RectangleHorizontal className="w-4 h-4 md:w-5 md:h-5"/>
          </button>
          
          <button
            onClick={() => setTool('ellipse')}
            className={`p-1.5 md:p-2 rounded-md transition-colors ${tool === 'ellipse' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            title="Ellipse (E)"
          >
            <Circle className="w-4 h-4 md:w-5 md:h-5"/>
          </button>
          
          {/* Mobile Color Picker Button */}
          {isMobileView && tool !== 'eraser' && (
            <>
              <div className="h-5 mx-1 w-px bg-gray-300 dark:bg-gray-600"></div>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1.5 rounded-md relative"
                style={{ backgroundColor: brushColor }}
                title="Change color"
              >
                <div className="w-4 h-4"></div>
                {showColorPicker && (
                  <div className="absolute bottom-full w-42 z-50 -left-20 mb-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
                    <div className="grid grid-cols-5 gap-1 mb-2">
                      {colorPalette.slice(0, 10).map((color) => (
                        <div
                          key={color}
                          onClick={() => {
                            setBrushColor(color);
                            setShowColorPicker(false);
                          }}
                          className={`w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110 ${brushColor === color ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                          style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid #dddddd' : 'none' }}
                          title={color}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="w-full h-6 cursor-pointer border-0 bg-transparent rounded"
                    />
                  </div>
                )}
              </button>
              
              {/* Mobile Size Slider */}
              <button
                onClick={() => setBrushSize(prev => Math.min(30, prev - 2))}
                className="p-1.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                title="Increase size"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                </svg>
              </button>
              
              <div className="text-xs font-mono mx-0.5 min-w-[24px] text-center">
                {brushSize}
              </div>
              
              <button
                onClick={() => setBrushSize(prev => Math.max(1, prev + 2))}
                className="p-1.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                title="Decrease size"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
              </button>
            </>
          )}
          
          {/* Toggle Sidebar Button - Only on desktop */}
          {!isMobileView && (
            <>
              <div className="h-6 mx-1 w-px bg-gray-300 dark:bg-gray-600"></div>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 md:p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title={isSidebarOpen ? "Hide options" : "Show options"}
              >
                {isSidebarOpen ? 
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                  </svg> 
                : 
                  <ArrowRight className='w-4 h-4 md:w-5 md:h-5'/>
                }
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Side Toolbar - Left Side - Colors and Size - Desktop only */}
      {!isMobileView && (
        <div 
          className={`fixed left-0 top-1/2 ml-4 transform -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg z-10 p-3 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'
          }`}
        >
          {/* Current Tool Indicator */}
          <div className="mb-4 flex flex-col items-center">
            <span className="text-xs text-gray-600 dark:text-gray-300 mb-1 font-medium">Current Tool</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
              {tool === 'pen' && (
                <Pen className="w-5 h-5"/>
              )}
              {tool === 'eraser' && (
                <Eraser className="w-5 h-5"/>
              )}
              {tool === 'line' && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                </svg>
              )}
              {tool === 'rect' && (
                <RectangleHorizontal className="w-5 h-5"/>
              )}
              {tool === 'ellipse' && (
                <Circle className="w-5 h-5"/>
              )}
            </div>
          </div>

          {/* Color Selection - Hide when eraser is selected */}
          {tool !== 'eraser' && (
            <div className="mb-4">
              <label className="text-xs text-gray-600 dark:text-gray-300 mb-1 font-medium block">Color</label>
              <div className="flex flex-row gap-2 items-center mb-2">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  title="Select custom color"
                />
                <div className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center"
                    style={{ backgroundColor: brushColor }}>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-1">
                {colorPalette.slice(0, 10).map((color) => (
                  <button
                    key={color}
                    onClick={() => setBrushColor(color)}
                    className={`w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110 ${brushColor === color ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                    style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid #dddddd' : 'none' }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Eraser info - Show only when eraser is selected */}
          {tool === 'eraser' && (
            <div className="mb-4 max-w-36">
              <div className="p-3 rounded-md bg-gray-100 dark:bg-gray-700/50">
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  <span className="font-medium block mb-1">Eraser Tool</span>
                  Click on any drawing element to erase it completely.
                </p>
              </div>
            </div>
          )}
          
          {/* Divider - Only show for drawing tools */}
          {tool !== 'eraser' && (
            <div className="h-px w-full bg-gray-300 dark:bg-gray-600 my-3"></div>
          )}
          
          {/* Size Adjustment - Only show for drawing tools */}
          {tool !== 'eraser' && (
            <div className="mb-1">
              <div className="flex justify-between">
                <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  Brush Size
                </label>
                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{brushSize}px</span>
              </div>
              
              {/* Visual Size Representation */}
              <div className="my-2 flex justify-center">
                <div 
                  className="bg-current rounded-full"
                  style={{ 
                    width: `${Math.min(40, brushSize * 2)}px`, 
                    height: `${Math.min(40, brushSize * 2)}px`,
                    backgroundColor: brushColor
                  }}
                ></div>
              </div>
              
              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full accent-blue-500"
                  title="Adjust size"
                />
                
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => setBrushSize(Math.max(1, brushSize - 1))}
                    className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Decrease size"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                    </svg>
                  </button>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setBrushSize(1)} 
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${brushSize === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                      title="Small (1px)"
                    >S</button>
                    <button 
                      onClick={() => setBrushSize(4)} 
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${brushSize === 4 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                      title="Medium (4px)"
                    >M</button>
                    <button 
                      onClick={() => setBrushSize(10)} 
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${brushSize === 10 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                      title="Large (10px)"
                    >L</button>
                  </div>
                  
                  <button 
                    onClick={() => setBrushSize(Math.min(30, brushSize + 1))}
                    className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Increase size"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}