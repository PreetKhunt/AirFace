import { AlertCircle, Loader2 } from 'lucide-react';

interface StateBoundaryProps {
  loading: boolean;
  error: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function StateBoundary({ 
  loading, 
  error, 
  isEmpty = false, 
  emptyMessage = "No data available.", 
  onRetry,
  children 
}: StateBoundaryProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-full min-h-[200px]">
        <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-full min-h-[200px] border border-red-500/20 bg-red-500/5 rounded-xl">
        <AlertCircle className="w-8 h-8 text-red-400 mb-4" />
        <p className="text-sm text-red-400 font-medium mb-4">{error}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            Retry Request
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-full min-h-[200px] border border-dashed border-border rounded-xl">
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
