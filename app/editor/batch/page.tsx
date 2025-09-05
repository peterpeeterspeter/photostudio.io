'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

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
  output_urls?: any;
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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState<string>('Ghost mannequin on neutral #f6f6f6 background.');
  const [batchId, setBatchId] = useState<string | null>(null);
  const [status, setStatus] = useState<BatchStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [presets, setPresets] = useState<Record<string, boolean>>({ 
    Instagram_Post: true, 
    Instagram_Reel: true, 
    Instagram_Story: false, 
    Facebook_Ad: false, 
    Pinterest_Pin: false, 
    Shopify_Product: true 
  });
  const [packs, setPacks] = useState<Record<string, boolean>>({
    Instagram_Complete: false,
    E_Commerce: true,
    Social_Media_Full: false,
    Content_Creator: false,
  });
  const [custom, setCustom] = useState<{ 
    label: string; 
    w: number; 
    h: number; 
    format: 'png'|'jpg'; 
    mode: 'contain'|'cover'; 
    background?: string; 
  }>({ 
    label: 'Custom-1200x1200', 
    w: 1200, 
    h: 1200, 
    format: 'png', 
    mode: 'contain', 
    background: '#ffffff' 
  });
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
    
    // Add settings for presets, packs, and custom variants
    const chosenPresets = Object.entries(presets).filter(([_, v]) => v).map(([k]) => k);
    const chosenPacks = Object.entries(packs).filter(([_, v]) => v).map(([k]) => k);
    const settings = { 
      presets: chosenPresets,
      packs: chosenPacks,
      variants: [custom] 
    };
    formData.append('settings', JSON.stringify(settings));
    
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

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login?redirectTo=' + encodeURIComponent('/editor/batch'));
    return null;
  }

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
                
                {/* Social Presets Selection */}
                <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-3">Social Media Packs</h4>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {Object.keys(packs).map((pack) => (
                      <label key={pack} className="flex items-center gap-2 text-sm font-medium text-blue-700">
                        <input 
                          type="checkbox" 
                          checked={packs[pack]} 
                          onChange={() => setPacks({ ...packs, [pack]: !packs[pack] })}
                          className="rounded"
                        />
                        <span>{pack.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                  
                  <h4 className="text-sm font-medium mb-3 mt-4">Individual Presets</h4>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {Object.keys(presets).map((preset) => (
                      <label key={preset} className="flex items-center gap-2 text-sm">
                        <input 
                          type="checkbox" 
                          checked={presets[preset]} 
                          onChange={() => setPresets({ ...presets, [preset]: !presets[preset] })}
                          className="rounded"
                        />
                        <span>{preset.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                  
                  <h4 className="text-sm font-medium mb-2">Custom Size</h4>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    <input 
                      value={custom.label} 
                      onChange={e => setCustom({ ...custom, label: e.target.value })} 
                      placeholder="Label" 
                      className="px-2 py-1 border rounded text-sm"
                    />
                    <input 
                      type="number" 
                      value={custom.w} 
                      onChange={e => setCustom({ ...custom, w: Number(e.target.value) })} 
                      placeholder="Width" 
                      className="px-2 py-1 border rounded text-sm"
                    />
                    <input 
                      type="number" 
                      value={custom.h} 
                      onChange={e => setCustom({ ...custom, h: Number(e.target.value) })} 
                      placeholder="Height" 
                      className="px-2 py-1 border rounded text-sm"
                    />
                    <select 
                      value={custom.format} 
                      onChange={e => setCustom({ ...custom, format: e.target.value as any })}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="png">PNG</option>
                      <option value="jpg">JPG</option>
                    </select>
                    <select 
                      value={custom.mode} 
                      onChange={e => setCustom({ ...custom, mode: e.target.value as any })}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="contain">Contain</option>
                      <option value="cover">Cover</option>
                    </select>
                  </div>
                  <input 
                    value={custom.background || ''} 
                    onChange={e => setCustom({ ...custom, background: e.target.value })} 
                    placeholder="Background color (#ffffff)" 
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                  
                  <p className="text-xs text-neutral-500 mt-2">
                    <strong>Packs</strong> expand into multiple formats automatically. 
                    <strong>Individual presets</strong> and <strong>custom size</strong> will be generated for each processed image.
                  </p>
                </div>
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
                <div className="flex gap-2">
                  {status?.batch?.status === 'completed' && (
                    <a
                      href={`/api/batch/zip?batch=${batchId}`}
                      className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Download ZIP
                    </a>
                  )}
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
                        
                        {item.status === 'done' && item.output_urls && (
                          <div className="p-3 bg-neutral-50">
                            {typeof item.output_urls === 'string' ? (
                              <a
                                href={item.output_urls}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                View Result →
                              </a>
                            ) : item.output_urls?.main ? (
                              <div className="space-y-2">
                                <a
                                  href={item.output_urls.main}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 font-medium block"
                                >
                                  Main Result →
                                </a>
                                {item.output_urls.variants && Object.keys(item.output_urls.variants).length > 0 && (
                                  <details className="text-xs">
                                    <summary className="cursor-pointer text-neutral-600">
                                      {Object.keys(item.output_urls.variants).length} variants
                                    </summary>
                                    <div className="mt-1 space-y-1">
                                      {Object.entries(item.output_urls.variants).map(([key, url]: [string, any]) => (
                                        <a
                                          key={key}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 block"
                                        >
                                          {key} →
                                        </a>
                                      ))}
                                    </div>
                                  </details>
                                )}
                              </div>
                            ) : null}
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