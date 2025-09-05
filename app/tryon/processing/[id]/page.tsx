"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ProcessingStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  message: string;
  estimatedTime?: number;
}

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<ProcessingStatus>({
    id: params.id as string,
    status: "processing",
    progress: 0,
    message: "Initializing virtual try-on...",
  });

  // Poll for real processing status
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/tryon/result/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        
        const result = await response.json();
        
        if (result.status === 'completed' && result.result) {
          setStatus(prev => ({
            ...prev,
            status: "completed",
            progress: 100,
            message: "Virtual try-on completed! Redirecting to results..."
          }));
          
          // Redirect to results page
          setTimeout(() => {
            router.push(`/tryon/result/${params.id}`);
          }, 1000);
          
          return; // Stop polling
        } else if (result.status === 'failed') {
          setStatus(prev => ({
            ...prev,
            status: "failed",
            message: result.error?.message || "Processing failed. Please try again."
          }));
          return; // Stop polling
        } else if (result.status === 'processing') {
          // Update progress if available
          const progress = result.progress || status.progress;
          let message = "Processing virtual try-on...";
          
          if (progress < 20) message = "Analyzing your photo...";
          else if (progress < 40) message = "Processing garment image...";
          else if (progress < 60) message = "Mapping garment to your body...";
          else if (progress < 80) message = "Generating realistic fit...";
          else if (progress < 100) message = "Finalizing results...";
          
          setStatus(prev => ({
            ...prev,
            progress,
            message,
            estimatedTime: Math.max(0, Math.round((100 - progress) / 10))
          }));
        }
      } catch (error) {
        console.error('Error polling status:', error);
        // Continue polling on error, might be temporary
      }
    };

    // Initial status check
    pollStatus();
    
    // Set up polling interval
    const interval = setInterval(pollStatus, 2000);

    return () => clearInterval(interval);
  }, [params.id, router]);

  return (
    <div className="bg-white">
      <div className="max-w-2xl mx-auto text-center">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Processing Your Virtual Try-On
          </h1>
          <p className="text-gray-600">
            Please wait while our AI creates your personalized try-on experience.
          </p>
        </div>

        {/* Processing Animation */}
        <div className="mb-8">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div 
              className="absolute inset-0 rounded-full border-4 border-indigo-600 transition-all duration-1000 ease-out"
              style={{
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + (status.progress / 100) * 50}% 0%, ${50 + (status.progress / 100) * 50}% 100%, 50% 100%)`
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-indigo-600">
                {Math.round(status.progress)}%
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${status.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Status Message */}
        <div className="mb-8">
          <p className="text-lg text-gray-700 mb-2">{status.message}</p>
          {status.estimatedTime && status.estimatedTime > 0 && (
            <p className="text-sm text-gray-500">
              Estimated time remaining: {status.estimatedTime} seconds
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Processing ID: {status.id}
          </p>
        </div>

        {/* Processing Steps */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">What's happening:</h3>
          <div className="space-y-3">
            <ProcessingStep 
              title="Photo Analysis" 
              completed={status.progress > 20}
              active={status.progress <= 20}
            />
            <ProcessingStep 
              title="Garment Processing" 
              completed={status.progress > 40}
              active={status.progress > 20 && status.progress <= 40}
            />
            <ProcessingStep 
              title="Body Mapping" 
              completed={status.progress > 60}
              active={status.progress > 40 && status.progress <= 60}
            />
            <ProcessingStep 
              title="Fit Generation" 
              completed={status.progress > 80}
              active={status.progress > 60 && status.progress <= 80}
            />
            <ProcessingStep 
              title="Final Rendering" 
              completed={status.progress > 95}
              active={status.progress > 80 && status.progress <= 95}
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold mb-2">Did you know?</h4>
          <p className="text-sm text-gray-600">
            Our AI analyzes over 100 body measurement points and garment characteristics 
            to create the most realistic virtual try-on experience possible.
          </p>
        </div>

        {/* Cancel Option */}
        <div className="mt-8">
          <Link
            href="/tryon"
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Cancel and return to try-on home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProcessingStep({ 
  title, 
  completed, 
  active 
}: { 
  title: string; 
  completed: boolean; 
  active: boolean;
}) {
  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg ${
      active ? "bg-indigo-50 border border-indigo-200" : "bg-gray-50"
    }`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
        completed 
          ? "bg-green-500 text-white" 
          : active 
            ? "bg-indigo-600 text-white" 
            : "bg-gray-300"
      }`}>
        {completed ? (
          <span className="text-xs">✓</span>
        ) : active ? (
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        ) : (
          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
        )}
      </div>
      <span className={`text-sm ${
        active ? "text-indigo-700 font-medium" : completed ? "text-green-700" : "text-gray-500"
      }`}>
        {title}
      </span>
    </div>
  );
}
