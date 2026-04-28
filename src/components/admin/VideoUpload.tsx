'use client';

import { useRef, useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Video } from 'lucide-react';

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
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    setSelectedFileName(file.name);
    setIsUploading(false);
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      alert('Please enter a video title');
      return;
    }

    if (!description.trim()) {
      alert('Please enter a video description');
      return;
    }

    const fileInput = fileInputRef.current;
    const file = fileInput?.files?.[0];

    if (!file) {
      alert('Please choose a video file first');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resourceType', 'video');
      formData.append('folder', 'mental-health/videos');

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setVideoUrl(data.imageUrl);
      setUploadStatus('success');

      onUpload({
        videoUrl: data.imageUrl,
        publicId: data.publicId,
        duration: data.duration,
        title,
        description,
      });

      setTitle('');
      setDescription('');
      setSelectedFileName('');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Video upload error:', error);
      setUploadStatus('error');
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
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
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 text-purple-600 font-medium hover:bg-purple-100 flex items-center justify-center gap-2"
        >
          <Video size={20} />
          {selectedFileName || 'Choose a Video File'}
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || !selectedFileName}
          className="mt-3 w-full px-4 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Upload size={20} />
          {isUploading ? 'Uploading...' : 'Upload Video'}
        </button>
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
