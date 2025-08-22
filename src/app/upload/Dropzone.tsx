'use client';
import React from 'react';
import styles from '../styles/Dropzone.module.css';
import { ALLOWED_TYPES, MAX_FILES } from './helpers';

interface Props {
  onAdd: (files: File[] | FileList) => void;
  totalCount: number;
}

export default function Dropzone({ onAdd, totalCount }: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    onAdd(e.target.files);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (!dt?.files?.length) return;
    onAdd(dt.files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  return (
    <div className={styles.wrapper}>
      <div className={styles.drop} onDrop={onDrop} onDragOver={onDragOver} role="button" tabIndex={0}
           onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click(); }}>
        <p className={styles.title}>Drag and drop your files here or click to select them.</p>
        <p className={styles.hint}>
          Accepted files: pdf. Max files allowed: {MAX_FILES}. Current: {totalCount}
        </p>
        <button type="button" className={styles.pick} onClick={() => inputRef.current?.click()}>
          Select files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          multiple
          className={styles.input}
          onChange={onInputChange}
          aria-label="Select files to upload"
        />
      </div>
    </div>
  );
}