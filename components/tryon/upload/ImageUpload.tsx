'use client';

import { useCallback, useState, useEffect } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';

interface ImageUploadProps {
  type: 'garment' | 'person';
  onUpload: (file: File) => void;
  currentFile?: File | null;
}

export function ImageUpload({ type, onUpload, currentFile }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      onUpload(file);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  // Cleanup object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const isGarment = type === 'garment';
  const placeholder = isGarment ? '👔' : '👤';
  const title = isGarment ? 'Upload Garment Photo' : 'Upload Your Photo';
  const subtitle = isGarment 
    ? 'Flat lay, mannequin, or product shots work best'
    : 'Face should be clearly visible, front-facing preferred';

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${preview ? 'border-green-500' : ''}
      `}
    >
      <input {...getInputProps()} />
      
      {preview ? (
        <div className="space-y-4">
          <div className="relative w-48 h-48 mx-auto">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <p className="font-medium text-green-700">✓ Image uploaded</p>
            <p className="text-sm text-gray-600">
              Click to choose a different photo
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-6xl">{placeholder}</div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
            <p className="text-xs text-gray-400">
              Drag & drop or click to select • Max 10MB • JPG, PNG, WebP
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
