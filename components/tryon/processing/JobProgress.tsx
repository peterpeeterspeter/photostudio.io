"use client";

import { useState, useEffect } from "react";

interface JobProgressProps {
  jobId: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep?: string;
  estimatedTime?: number;
  onCancel?: () => void;
  className?: string;
}

export default function JobProgress({
  jobId,
  progress: initialProgress = 0,
  status: initialStatus = 'processing',
  currentStep = 'Initializing...',
  estimatedTime = 0,
  onCancel,
  className = ""
}: JobProgressProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [status, setStatus] = useState(initialStatus);
  const [step, setStep] = useState(currentStep);
  const [timeRemaining, setTimeRemaining] = useState(estimatedTime);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Simulate progress updates if not provided
  useEffect(() => {
    if (status === 'processing' && progress < 100) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.random() * 2;
          return Math.min(prev + increment, 100);
        });
        
        setTimeRemaining(prev => Math.max(0, prev - 1));
        setElapsedTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status, progress]);

  // Update step based on progress
  useEffect(() => {
    if (progress < 20) {
      setStep('Analyzing uploaded photos...');
    } else if (progress < 40) {
      setStep('Processing garment details...');
    } else if (progress < 60) {
      setStep('Mapping garment to body...');
    } else if (progress < 80) {
      setStep('Generating realistic fit...');
    } else if (progress < 100) {
      setStep('Finalizing results...');
    } else {
      setStep('Processing complete!');
      setStatus('completed');
    }
  }, [progress]);

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'processing':
        return 'text-indigo-600';
      case 'pending':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'processing':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">Processing Job</h4>
          <p className="text-sm text-gray-500">ID: {jobId}</p>
        </div>
        <div className={`text-2xl font-bold ${getStatusColor()}`}>
          {Math.round(progress)}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{step}</span>
          <span className="text-xs text-gray-500">
            {status === 'processing' && `${Math.round(progress)}%`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ease-out ${getProgressBarColor()}`}
            style={{ width: `${progress}%` }}
          >
            {status === 'processing' && progress > 0 && (
              <div className="h-full bg-white rounded-full opacity-30 animate-pulse"></div>
            )}
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Status:</span>
          <span className={`ml-2 font-medium capitalize ${getStatusColor()}`}>
            {status}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Elapsed:</span>
          <span className="ml-2 font-medium text-gray-900">
            {formatTime(elapsedTime)}
          </span>
        </div>
        {timeRemaining > 0 && status === 'processing' && (
          <>
            <div>
              <span className="text-gray-500">Remaining:</span>
              <span className="ml-2 font-medium text-gray-900">
                ~{formatTime(timeRemaining)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Priority:</span>
              <span className="ml-2 font-medium text-gray-900">Normal</span>
            </div>
          </>
        )}
      </div>

      {/* Status Messages */}
      {status === 'completed' && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-green-500 text-lg mr-2">✓</span>
            <p className="text-sm text-green-700 font-medium">
              Virtual try-on completed successfully!
            </p>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 text-lg mr-2">✗</span>
            <p className="text-sm text-red-700 font-medium">
              Processing failed. Please try again.
            </p>
          </div>
        </div>
      )}

      {status === 'processing' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            <p className="text-sm text-blue-700">
              Please wait while we process your virtual try-on...
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {status === 'processing' && 'You can close this window and check back later'}
        </div>
        <div className="space-x-2">
          {status === 'processing' && onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          )}
          {status === 'completed' && (
            <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
              View Results
            </button>
          )}
          {status === 'failed' && (
            <button className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition">
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Queue Information */}
      {status === 'pending' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Position in queue:</span>
            <span className="font-medium">3rd</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
            <span>Estimated wait:</span>
            <span className="font-medium">2-3 minutes</span>
          </div>
        </div>
      )}
    </div>
  );
}
