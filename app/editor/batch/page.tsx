'use client';
import React, { useEffect, useState, useRef } from 'react';

const PRESETS = {
  "Ghost Mannequin": "Remove human/model/mannequin entirely. Preserve realistic inner neck/arm openings and natural drape (ghost mannequin style). Neutral #f6f6f6 background. No warping.",
  "Studio Background": "Replace background with seamless white studio sweep. Soft, shadowless lighting. Preserve garment shape, fabric texture, and true colors. No distortion.",
  "Lifestyle Loft": "Place garment on a tasteful lifestyle scene: sunlit loft with wooden floor and soft window light. Keep proportions and fabric details intact.",
  "Flatlay Marble": "Transform into a top-down flatlay on white marble. Neatly arrange the item centered, subtle soft shadows, accurate texture."
};

interface BatchItem {
  id: string;
  status: 'queued' | 'working' | 'done' | 'error';
  source_url?: string;
  output_url?: string;
  error?: string;
}

interface BatchStatus {
  batch: {
    id: string;
    name: string;
    status: string;
    created_at: string;
    completed_at?: string;
  };
  items: BatchItem[];
  progress: {
    total: number;
    completed: number;
    failed: number;
    processing: number;
    queued: number;
    percentage: number;
  };
}

export default function BatchEditor() {
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState<string>('Ghost mannequin on neutral #f6f6f6 background.');
  const [batchId, setBatchId] = useState<string | null>(null);
  const [status, setStatus] = useState<BatchStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = (newFiles: FileList | null) => {
    if (!newFiles) return;
    
    const validFiles = Array.from(newFiles).filter(file => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > 18 * 1024 * 1024) return false; // 18MB limit
      return true;
    });
    
    if (validFiles.length + files.length > 25) {
      alert('Maximum 25 images allowed per batch');
      return;
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const createBatch = async () => {
    if (!files.length) {
      alert('Please select images to process');
      return;
    }
    
    setIsProcessing(true);
    
    const formData = new FormData();
    formData.append('name', `Batch ${new Date().toLocaleString()}`);
    formData.append('prompt', prompt);
    files.forEach(file => formData.append('images', file));
    
    try {
      const response = await fetch('/api/batch/create', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.error) {
        alert(result.error);
        setIsProcessing(false);
        return;
      }
      
      setBatchId(result.batch_id);
      setFiles([]); // Clear files after successful creation
    } catch (error) {
      console.error('Batch creation failed:', error);
      alert('Failed to create batch. Please try again.');
      setIsProcessing(false);
    }
  };

  // Poll for batch status
  useEffect(() => {
    if (!batchId) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/batch/status?batch=${batchId}`);
        const data = await response.json();
        setStatus(data);
        
        if (data.batch?.status === 'completed' || data.batch?.status === 'failed') {
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Failed to fetch batch status:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [batchId]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-20 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-black" />
            <h1 className="text-lg font-semibold">Photostudio.io — Batch Editor</h1>
          </div>
          <div className="flex gap-2 text-sm">
            <a href="/editor" className="text-neutral-600 hover:text-black">Single Editor</a>
            <span className="text-neutral-300">|</span>
            <span className="text-black font-medium">Batch Editor</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {!batchId ? (
          // Batch Creation Interface
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Create New Batch</h2>
              <p className="text-neutral-600 mb-6">
                Upload multiple images for AI processing. All images will be processed with the same prompt using our advanced pipeline.
              </p>

              {/* File Upload Area */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Select Images (max 25)</label>
                <div
                  className="relative flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-100 cursor-pointer hover:border-neutral-400 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFilesChange(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center">
                    <div className="text-neutral-500 mb-2">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-sm text-neutral-600">
                      Drag & drop images here, or click to browse
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      JPG, PNG • Max 18MB per file • Up to 25 files
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFilesChange(e.target.files)}
                  />
                </div>
              </div>

              {/* Selected Files Preview */}
              {files.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">Selected Images ({files.length}/25)</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {files.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                          {Math.round(file.size / 1024)}KB
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Processing Preset</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {Object.entries(PRESETS).map(([name, text]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setPrompt(text)}
                      className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                        prompt === text 
                          ? 'border-black bg-black text-white' 
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="font-medium">{name}</div>
                    </button>
                  ))}
                </div>
                
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Custom processing instructions..."
                  className="w-full h-24 p-3 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-black/20 focus:border-black"
                />
              </div>

              {/* Create Batch Button */}
              <button
                onClick={createBatch}
                disabled={!files.length || isProcessing}
                className="w-full bg-black text-white py-3 px-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
              >
                {isProcessing ? 'Creating Batch...' : `Create Batch (${files.length} images)`}
              </button>
            </div>
          </div>
        ) : (
          // Batch Status Interface
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Batch Processing</h2>
                <button
                  onClick={() => {
                    setBatchId(null);
                    setStatus(null);
                    setIsProcessing(false);
                  }}
                  className="text-sm text-neutral-600 hover:text-black"
                >
                  ← Create New Batch
                </button>
              </div>

              {status && (
                <>
                  {/* Progress Overview */}
                  <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-neutral-600">
                        {status.progress.completed}/{status.progress.total} completed
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className="bg-black h-2 rounded-full transition-all duration-500"
                        style={{ width: `${status.progress.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500 mt-2">
                      <span>Queued: {status.progress.queued}</span>
                      <span>Processing: {status.progress.processing}</span>
                      <span>Failed: {status.progress.failed}</span>
                    </div>
                  </div>

                  {/* Results Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {status.items.map((item, index) => (
                      <div key={item.id} className="border rounded-lg overflow-hidden">
                        <div className="aspect-square relative">
                          {item.source_url && (
                            <img
                              src={item.source_url}
                              alt={`Original ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'done' ? 'bg-green-100 text-green-800' :
                            item.status === 'working' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status === 'done' ? 'Done' :
                             item.status === 'working' ? 'Processing' :
                             item.status === 'error' ? 'Failed' : 'Queued'}
                          </div>
                        </div>
                        
                        {item.status === 'done' && item.output_url && (
                          <div className="p-3 bg-neutral-50">
                            <a
                              href={item.output_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Result →
                            </a>
                          </div>
                        )}
                        
                        {item.status === 'error' && (
                          <div className="p-3 bg-red-50">
                            <p className="text-xs text-red-600">
                              {item.error || 'Processing failed'}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}