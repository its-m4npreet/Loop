'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import Avatar from '@/app/components/Avatar';

const MAX_DIMENSION = 256;

interface ProfileAvatarProps {
  userName: string | null;
  userImage?: string | null;
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function ProfileAvatar({ userName, userImage }: ProfileAvatarProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    setUploading(true);
    try {
      const dataUrl = await resizeImage(file);
      setPreview(dataUrl);

      const res = await fetch('/api/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (!res.ok) throw new Error('Upload failed');

      window.location.reload();
    } catch {
      setPreview(null);
      setUploading(false);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="profile-avatar-section">
      <Avatar name={userName} src={preview || userImage} size="xl" />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="profile-avatar-file-input"
        onChange={handleChange}
        disabled={uploading}
      />
      <button
        className="profile-avatar-edit-btn"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        type="button"
      >
        {uploading ? (
          <Loader2 size={14} className="profile-avatar-spin" />
        ) : (
          <Camera size={14} />
        )}
        {uploading ? 'Uploading…' : 'Change Photo'}
      </button>
    </div>
  );
}
