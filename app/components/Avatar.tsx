'use client';

import { useState } from 'react';
import './Avatar.css';

const COLORS: [string, string][] = [
  ['#22c55e', '#16a34a'],
  ['#3b82f6', '#2563eb'],
  ['#8b5cf6', '#7c3aed'],
  ['#f59e0b', '#d97706'],
  ['#ef4444', '#dc2626'],
  ['#06b6d4', '#0891b2'],
  ['#ec4899', '#db2777'],
  ['#f97316', '#ea580c'],
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColor(name: string | null | undefined): [string, string] {
  if (!name) return COLORS[0];
  return COLORS[hashName(name) % COLORS.length];
}

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name: string | null | undefined;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

export default function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const [bg, bgDark] = getColor(name);
  const showImage = src && !imgError;

  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={showImage ? undefined : { background: `linear-gradient(135deg, ${bg}, ${bgDark})` }}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          className="avatar-img"
          src={src}
          alt=""
          onError={() => setImgError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
