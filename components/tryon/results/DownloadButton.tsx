"use client";

import { useState } from "react";

interface DownloadButtonProps {
  imageUrl: string;
  filename?: string;
  format?: 'jpg' | 'png' | 'webp';
  quality?: number;
  className?: string;
  children?: React.ReactNode;
}

export default function DownloadButton({
  imageUrl,
  filename = 'tryon-result',
  format = 'jpg',
  quality = 0.9,
  className = "",
  children
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(format);
  const [selectedQuality, setSelectedQuality] = useState(quality);

  const downloadImage = async (downloadFormat = selectedFormat, downloadQuality = selectedQuality) => {
    try {
      setIsDownloading(true);

      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      
      // If format conversion is needed and format is specified
      if (downloadFormat && downloadFormat !== 'original') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = URL.createObjectURL(blob);
        });

        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        // Convert to desired format
        const convertedBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (blob) => resolve(blob!),
            `image/${downloadFormat}`,
            downloadQuality
          );
        });

        // Download the converted image
        const url = URL.createObjectURL(convertedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.${downloadFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(img.src);
      } else {
        // Download original format
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.${getOriginalExtension(imageUrl)}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
      setShowOptions(false);
    }
  };

  const getOriginalExtension = (url: string) => {
    const match = url.match(/\.([^.?]+)(\?|$)/);
    return match ? match[1] : 'jpg';
  };

  const formatOptions = [
    { value: 'jpg', label: 'JPEG', description: 'Smaller file size' },
    { value: 'png', label: 'PNG', description: 'Lossless quality' },
    { value: 'webp', label: 'WebP', description: 'Modern format' },
  ];

  const qualityOptions = [
    { value: 1.0, label: 'High', description: '100% quality' },
    { value: 0.9, label: 'Medium', description: '90% quality' },
    { value: 0.7, label: 'Low', description: '70% quality' },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Main Download Button */}
      <div className="flex">
        <button
          onClick={() => downloadImage()}
          disabled={isDownloading}
          className={`
            flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-l-lg hover:bg-green-700 transition font-medium
            ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isDownloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Downloading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {children || 'Download'}
            </>
          )}
        </button>

        {/* Options Dropdown Button */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          disabled={isDownloading}
          className={`
            px-3 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 transition border-l border-green-500
            ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Options Dropdown */}
      {showOptions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Download Options</h4>
            
            {/* Format Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <div className="space-y-2">
                {formatOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value={option.value}
                      checked={selectedFormat === option.value}
                      onChange={(e) => setSelectedFormat(e.target.value as any)}
                      className="mr-2"
                    />
                    <div>
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-gray-500 ml-2">{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Quality Selection (for JPEG/WebP) */}
            {(selectedFormat === 'jpg' || selectedFormat === 'webp') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                <div className="space-y-2">
                  {qualityOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="quality"
                        value={option.value}
                        checked={selectedQuality === option.value}
                        onChange={(e) => setSelectedQuality(parseFloat(e.target.value))}
                        className="mr-2"
                      />
                      <div>
                        <span className="text-sm font-medium">{option.label}</span>
                        <span className="text-xs text-gray-500 ml-2">{option.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => downloadImage()}
                disabled={isDownloading}
                className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm"
              >
                Download ({selectedFormat.toUpperCase()})
              </button>
              <button
                onClick={() => setShowOptions(false)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
