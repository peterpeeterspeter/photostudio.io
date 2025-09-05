'use client';

import { useState } from 'react';
import { ImageUpload } from './upload/ImageUpload';
import { GarmentTypeSelector } from './upload/GarmentTypeSelector';
import { GarmentType } from '@/types/tryon';

interface TryOnUploadProps {
  onProcessStart: (jobId: string) => void;
}

export function TryOnUpload({ onProcessStart }: TryOnUploadProps) {
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [garmentType, setGarmentType] = useState<GarmentType>('shirt');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!garmentFile || !personFile) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      // Upload garment image
      const garmentFormData = new FormData();
      garmentFormData.append('file', garmentFile);
      garmentFormData.append('type', 'garment');
      garmentFormData.append('garmentType', garmentType);
      
      const garmentUploadRes = await fetch('/api/tryon/upload', {
        method: 'POST',
        body: garmentFormData,
      });
      
      if (!garmentUploadRes.ok) {
        throw new Error('Failed to upload garment image');
      }
      
      const garmentUpload = await garmentUploadRes.json();

      if (!garmentUpload.success) {
        throw new Error(garmentUpload.error || 'Garment upload failed');
      }

      // Upload person image
      const personFormData = new FormData();
      personFormData.append('file', personFile);
      personFormData.append('type', 'person');
      
      const personUploadRes = await fetch('/api/tryon/upload', {
        method: 'POST',
        body: personFormData,
      });
      
      if (!personUploadRes.ok) {
        throw new Error('Failed to upload person image');
      }
      
      const personUpload = await personUploadRes.json();

      if (!personUpload.success) {
        throw new Error(personUpload.error || 'Person upload failed');
      }

      // Start processing
      const processRes = await fetch('/api/tryon/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garmentImageUrl: garmentUpload.previewUrl,
          userImageUrl: personUpload.previewUrl,
          garmentType,
          options: {
            quality: 'standard',
            fitPreference: 'regular',
            preserveBackground: true,
            enhanceLighting: true,
            generateShadows: true
          }
        }),
      });
      
      if (!processRes.ok) {
        throw new Error('Failed to start processing');
      }
      
      const processResponse = await processRes.json();

      if (processResponse.success && processResponse.jobId) {
        onProcessStart(processResponse.jobId);
      } else {
        throw new Error(processResponse.error?.message || 'Failed to start processing');
      }
      
    } catch (error) {
      console.error('Try-on processing failed:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const canProcess = garmentFile && personFile && !processing;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Garment Upload */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">1. Upload Garment</h2>
          <ImageUpload
            type="garment"
            onUpload={setGarmentFile}
            currentFile={garmentFile}
          />
        </div>
        
        <GarmentTypeSelector
          value={garmentType}
          onChange={setGarmentType}
        />
      </div>

      {/* Person Upload */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">2. Upload Your Photo</h2>
          <ImageUpload
            type="person"
            onUpload={setPersonFile}
            currentFile={personFile}
          />
        </div>

        <div className="pt-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <button
            onClick={handleProcess}
            disabled={!canProcess}
            className={`w-full py-3 text-lg rounded-lg font-semibold transition-all ${
              canProcess
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {processing ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              'Start Virtual Try-On'
            )}
          </button>
          
          {!garmentFile || !personFile ? (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Please upload both a garment image and your photo to continue
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
