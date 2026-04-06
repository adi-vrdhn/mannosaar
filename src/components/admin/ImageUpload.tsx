'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

interface ImageData {
  file: File;
  preview: string;
  caption: string;
}

interface ImageUploadProps {
  onUpload: (data: {
    imageUrl: string;
    caption: string;
  }) => void;
}

export default function ImageUpload({ onUpload }: ImageUploadProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 10;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    
    // Check if adding these files would exceed limit
    if (images.length + newFiles.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    newFiles.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, {
          file,
          preview: e.target?.result as string,
          caption: '',
        }]);
        setError('');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-purple-100');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-purple-100');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-purple-100');
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    setImages(prev => {
      const updated = [...prev];
      updated[index].caption = caption;
      return updated;
    });
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      setError('Please select at least one image');
      return;
    }

    // Check if all images have captions
    if (images.some(img => !img.caption.trim())) {
      setError('All images must have a caption');
      return;
    }

    setIsLoading(true);
    setUploadStatus('uploading');
    setError('');

    try {
      // Upload all images sequentially and wait for completion
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        // Convert file to DataURL using Promise
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(img.file);
        });

        // Upload to API
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: dataUrl,
            caption: img.caption,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        
        // Call onUpload for each successfully uploaded image
        onUpload({
          imageUrl: data.imageUrl,
          caption: img.caption,
        });
      }

      // After all images are uploaded successfully
      setUploadStatus('success');
      setImages([]);
      
      setTimeout(() => {
        setUploadStatus('idle');
      }, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload images';
      console.error('Image upload error:', err);
      setError(errorMsg);
      setUploadStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {images.length < MAX_IMAGES && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="border-2 border-dashed border-purple-300 rounded-lg p-8 bg-purple-50 cursor-pointer transition-colors hover:bg-purple-100"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            hidden
          />

          <div className="flex flex-col items-center justify-center gap-3">
            <Upload size={32} className="text-purple-600" />
            <div className="text-center">
              <p className="font-medium text-purple-900">Drag images here or click to select</p>
              <p className="text-sm text-purple-600">JPG, PNG up to 5MB each</p>
              <p className="text-xs text-purple-500 mt-1">
                {images.length} / {MAX_IMAGES} images selected
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Previews with Captions */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="space-y-2">
                <div className="relative rounded-lg overflow-hidden bg-gray-100">
                  <img src={img.preview} alt={`Preview ${idx + 1}`} className="w-full h-32 object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                    title="Remove image"
                  >
                    <X size={16} />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {idx + 1}
                  </span>
                </div>

                <input
                  type="text"
                  value={img.caption}
                  onChange={(e) => updateCaption(idx, e.target.value)}
                  placeholder={`Caption for image ${idx + 1}`}
                  maxLength={100}
                  className="w-full px-3 py-2 text-sm rounded border border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <p className="text-xs text-gray-500">{img.caption.length}/100</p>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isLoading || images.some(img => !img.caption.trim())}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
          >
            {isLoading ? 'Uploading...' : `Post ${images.length} Image${images.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle size={20} />
          <span>Images posted successfully!</span>
        </div>
      )}
    </div>
  );
}
