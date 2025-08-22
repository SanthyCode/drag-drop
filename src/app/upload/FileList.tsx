'use client';
import React from 'react';
import styles from '../styles/FileList.module.css';
import { FileDescriptor } from './types';

interface Props {
  files: FileDescriptor[];
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onTagChange: (id: string, tag: string) => void;
}

export default function FileList({
  files, onRemove, onCancel, onRetry, onTagChange,
}: Props) {
  if (files.length === 0) return null;

  return (
    <div className={styles.list}>
      {files.map((f) => (
        <div key={f.id} className={styles.item}>
          <div className={styles.main}>
            <div className={styles.nameType}>
              <strong className={styles.name}>{f.name}</strong>
              <span className={styles.type}>{f.type}</span>
            </div>

            <div className={styles.meta}>
              <div className={styles.progressWrap}>
                <label className={styles.progressLabel} htmlFor={`progress-${f.id}`}>
                  Status: {f.status}
                </label>
                <progress
                  id={`progress-${f.id}`}
                  className={styles.progress}
                  value={f.progress}
                  max={100}
                  aria-live="polite"
                />
                <span className={styles.percent}>{f.progress}%</span>
              </div>

              <div className={styles.controls}>
                {f.status === 'uploading' && (
                  <button className={styles.secondary} onClick={() => onCancel(f.id)}>
                    Cancel
                  </button>
                )}
                {f.status === 'error' && (
                  <button className={styles.secondary} onClick={() => onRetry(f.id)}>
                    Retry
                  </button>
                )}
                <button
                  className={styles.danger}
                  onClick={() => (f.status === 'uploading' ? onCancel(f.id) : onRemove(f.id))}
                  aria-label={`Delete ${f.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div className={styles.details}>
            <select
              aria-label={`Select tag for ${f.name}`}
              className={styles.select}
              value={f.tag || ''}
              onChange={(e) => onTagChange(f.id, e.target.value)}
            >
              <option value="">Select tag</option>
              <option value="finance">Finance</option>
              <option value="legal">Legal</option>
              <option value="hr">HR</option>
            </select>

            <span className={styles.small}>{
              new Date(f.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' })
            }</span>
            <span className={styles.small}>{f.createdBy}</span>
          </div>

          {f.error && <div className={styles.error} role="alert">Error: {f.error}</div>}
        </div>
      ))}
    </div>
  );
}