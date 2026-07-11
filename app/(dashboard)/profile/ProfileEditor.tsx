'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

interface ProfileEditorProps {
  initialName: string;
}

export default function ProfileEditor({ initialName }: ProfileEditorProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function handleCancel() {
    setName(initialName);
    setEditing(false);
    setError('');
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name cannot be empty');
      return;
    }
    if (trimmed === initialName) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  }

  if (editing) {
    return (
      <div className="profile-editor">
        <input
          ref={inputRef}
          className="profile-editor-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={saving}
          maxLength={100}
        />
        <div className="profile-editor-actions">
          <button
            className="profile-editor-btn save"
            onClick={handleSave}
            disabled={saving}
            aria-label="Save name"
          >
            {saving ? <Loader2 size={14} className="profile-avatar-spin" /> : <Check size={14} />}
          </button>
          <button
            className="profile-editor-btn cancel"
            onClick={handleCancel}
            disabled={saving}
            aria-label="Cancel"
          >
            <X size={14} />
          </button>
        </div>
        {error && <p className="profile-editor-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="profile-editor">
      <span className="profile-editor-name">{name || 'User'}</span>
      <button
        className="profile-editor-btn edit"
        onClick={() => setEditing(true)}
        aria-label="Edit name"
      >
        <Pencil size={13} />
      </button>
    </div>
  );
}
