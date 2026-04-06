'use client';

import { CldUploadWidget } from 'next-cloudinary';
import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface VideoUploadProps {
  onUpload: (data: {
    videoUrl: string;
    publicId: string;
    duration?: number;
    title: string;
    description: string;
  }) => void;
}

export default function VideoUpload({ onUpload }: VideoUploadProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleUploadSuccess = (result: any) => {
    const url = result.info.secure_url;
    const publicId = result.info.public_id;

    setVideoUrl(url);
    setIsUploading(false);
    setUploadStatus('success');

    // Auto-call onUpload after a short delay
    setTimeout(() => {
      onUpload({
        videoUrl: url,
        publicId: publicId,
        duration: result.info.duration,
        title,
        description,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setUploadStatus('idle');
    }, 1500);
  };

  const handleUploadError = () => {
    setIsUploading(false);
    setUploadStatus('error');
  };

  return (
    <div className="space-y-4">
      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter video title"
          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      {/* Description Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter video description"
          rows={4}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
        />
      </div>

      {/* Upload Widget */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Video
        </label>
        <CldUploadWidget
          uploadPreset="ml_default"
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
        >
          {({ open }) => (
            <button
              onClick={() => {
                // Validate title and description before upload
                if (!title.trim()) {
                  alert('Please enter a video title');
                  return;
                }
                if (!description.trim()) {
                  alert('Please enter a video description');
                  return;
                }
                setIsUploading(true);
                open();
              }}
              disabled={isUploading}
              className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 text-purple-600 font-medium hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              {isUploading ? 'Uploading...' : 'Click to Upload Video'}
            </button>
          )}
        </CldUploadWidget>
      </div>

      {/* Status Messages */}
      {uploadStatus === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle size={20} />
          <span>Video uploaded successfully!</span>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={20} />
          <span>Upload failed. Please try again.</span>
        </div>
      )}

      {videoUrl && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
          <video src={videoUrl} controls className="w-full rounded-lg max-h-96" />
        </div>
      )}
    </div>
  );
}
