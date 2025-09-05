"use client";

import { useState, useEffect } from "react";

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  duration?: number; // estimated duration in seconds
}

interface ProcessingStatusProps {
  jobId: string;
  onComplete?: (success: boolean) => void;
  onError?: (error: string) => void;
  className?: string;
}

const PROCESSING_STEPS: ProcessingStep[] = [
  {
    id: 'upload',
    name: 'Upload Complete',
    description: 'Photos uploaded and validated',
    status: 'completed'
  },
  {
    id: 'analysis',
    name: 'Photo Analysis',
    description: 'Analyzing body shape and pose',
    status: 'pending',
    duration: 8
  },
  {
    id: 'garment',
    name: 'Garment Processing',
    description: 'Processing garment characteristics',
    status: 'pending',
    duration: 6
  },
  {
    id: 'mapping',
    name: 'Body Mapping',
    description: 'Mapping garment to body measurements',
    status: 'pending',
    duration: 10
  },
  {
    id: 'generation',
    name: 'Image Generation',
    description: 'Creating realistic try-on image',
    status: 'pending',
    duration: 12
  },
  {
    id: 'finalization',
    name: 'Final Processing',
    description: 'Optimizing and finalizing results',
    status: 'pending',
    duration: 4
  }
];

export default function ProcessingStatus({
  jobId,
  onComplete,
  onError,
  className = ""
}: ProcessingStatusProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>(PROCESSING_STEPS);
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(40);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Simulate processing progress
  useEffect(() => {
    const interval = setInterval(() => {
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        const totalSteps = newSteps.length;
        
        // Update progress
        setProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 3, 100);
          
          // Update current step based on progress
          const stepProgress = (newProgress / 100) * totalSteps;
          const newCurrentStep = Math.floor(stepProgress);
          setCurrentStep(newCurrentStep);
          
          // Update step statuses
          newSteps.forEach((step, index) => {
            if (index < newCurrentStep) {
              step.status = 'completed';
            } else if (index === newCurrentStep) {
              step.status = 'active';
            } else {
              step.status = 'pending';
            }
          });
          
          // Calculate estimated time remaining
          const remainingSteps = totalSteps - newCurrentStep;
          const avgStepDuration = 7; // seconds
          setEstimatedTimeRemaining(Math.max(0, remainingSteps * avgStepDuration));
          
          // Check if complete
          if (newProgress >= 100 && !isComplete) {
            setIsComplete(true);
            newSteps.forEach(step => {
              step.status = 'completed';
            });
            onComplete?.(true);
            clearInterval(interval);
          }
          
          return newProgress;
        });
        
        return newSteps;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isComplete, onComplete]);

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <span className="text-green-500 text-lg">✓</span>;
      case 'active':
        return (
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        );
      case 'failed':
        return <span className="text-red-500 text-lg">✗</span>;
      case 'pending':
        return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
    }
  };

  const getStepTextColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-700';
      case 'active':
        return 'text-indigo-700 font-medium';
      case 'failed':
        return 'text-red-700';
      case 'pending':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Processing Your Virtual Try-On
        </h3>
        <p className="text-sm text-gray-600">
          Job ID: {jobId}
        </p>
      </div>

      {/* Progress Circle */}
      <div className="flex justify-center mb-6">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
              className="text-indigo-600 transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-indigo-600">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-700 mb-1">
          {isComplete ? 'Processing complete!' : `Step ${currentStep + 1} of ${steps.length}`}
        </p>
        {estimatedTimeRemaining > 0 && !isComplete && (
          <p className="text-xs text-gray-500">
            Estimated time remaining: {estimatedTimeRemaining} seconds
          </p>
        )}
      </div>

      {/* Processing Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getStepIcon(step.status)}
            </div>
            <div className="flex-grow min-w-0">
              <div className={`text-sm ${getStepTextColor(step.status)}`}>
                <p className="font-medium">{step.name}</p>
                <p className="text-xs mt-1">{step.description}</p>
              </div>
            </div>
            {step.status === 'active' && step.duration && (
              <div className="flex-shrink-0 text-xs text-gray-500">
                ~{step.duration}s
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Technical Details (Collapsible) */}
      <details className="mt-6 pt-4 border-t border-gray-200">
        <summary className="cursor-pointer text-sm text-gray-600 font-medium hover:text-gray-800">
          Technical Details
        </summary>
        <div className="mt-3 space-y-2 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>AI Provider:</span>
            <span>Nano Banana</span>
          </div>
          <div className="flex justify-between">
            <span>Processing Server:</span>
            <span>us-west-1</span>
          </div>
          <div className="flex justify-between">
            <span>Started:</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Quality Mode:</span>
            <span>High Resolution</span>
          </div>
        </div>
      </details>

      {/* Info Message */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <span className="font-semibold">💡 Did you know?</span> Our AI analyzes over 100 body measurement points and garment characteristics to create the most realistic virtual try-on experience.
        </p>
      </div>
    </div>
  );
}
