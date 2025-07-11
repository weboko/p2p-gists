import React, { useState } from 'react';
import { useIdentity } from '../hooks/useIdentity.js';
import { formatRelativeTime } from '../lib/utils.js';

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function IdentityModal({ onClose }) {
  const { identity, exportIdentity, importIdentity, resetIdentity } = useIdentity();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportError(null);
      await importIdentity(file);
      onClose();
    } catch (error) {
      setImportError(error.message);
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleExport = async () => {
    try {
      await exportIdentity();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to generate a new identity? This will permanently delete your current identity.')) {
      try {
        await resetIdentity();
        onClose();
      } catch (error) {
        console.error('Reset failed:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Identity Management
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Identity Info */}
        {identity && (
          <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nickname
                </label>
                <p className="text-lg font-mono text-gray-900 dark:text-white">
                  {identity.nickname}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Created
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatRelativeTime(identity.createdAt)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Public Key ID
                </label>
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all">
                  {identity.id.substring(0, 32)}...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Export */}
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
          >
            <DownloadIcon />
            <span className="ml-2">Export Identity</span>
          </button>

          {/* Import */}
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isImporting}
            />
            <button
              disabled={isImporting}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UploadIcon />
              <span className="ml-2">
                {isImporting ? 'Importing...' : 'Import Identity'}
              </span>
            </button>
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-dark-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <RefreshIcon />
            <span className="ml-2">Generate New Identity</span>
          </button>
        </div>

        {/* Import Error */}
        {importError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-400">
              {importError}
            </p>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          <p>
            Your identity is used to sign code snippets. Export it to use the same identity across devices.
          </p>
        </div>
      </div>
    </div>
  );
} 