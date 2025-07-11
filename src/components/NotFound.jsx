import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundIcon = () => (
  <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default function NotFound() {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-8">
        <NotFoundIcon />
      </div>
      
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        404
      </h1>
      
      <h2 className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-8">
        Page Not Found
      </h2>
      
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      
      <div className="space-y-4">
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          Create New Snippet
        </Link>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>
            If you&apos;re looking for a specific code snippet, make sure you have the correct URL.
          </p>
        </div>
      </div>
    </div>
  );
} 