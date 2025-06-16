export default function LoadingOverlay({ message = "Loading..." }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 z-50 backdrop-blur-sm">
      <div className="flex flex-col items-center p-8 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
        <div className="relative w-16 h-16">
          <div className="w-16 h-16 rounded-full border-4 border-blue-200 dark:border-blue-900"></div>
          <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-700 dark:text-gray-200 font-medium text-lg">{message}</p>
      </div>
    </div>
  );
}