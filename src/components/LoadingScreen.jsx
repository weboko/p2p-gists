import React from 'react';

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
);

const ErrorIcon = () => (
  <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function LoadingScreen({ error }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <ErrorIcon />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Initialization Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <LoadingSpinner />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Initializing P2P Gists
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Setting up secure connections...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 