'use client';
import { useCallback, useMemo, useReducer, useRef } from 'react';
import { FileDescriptor } from './types';
import { ALLOWED_TYPES, MAX_FILE_SIZE, MAX_FILES } from './helpers';

type State = { files: FileDescriptor[] };
type Action =
  | { type: 'ADD'; files: FileDescriptor[] }
  | { type: 'UPDATE'; id: string; patch: Partial<FileDescriptor> }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_TAG'; id: string; tag: string }
  | { type: 'RESET' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':
      return { files: [...state.files, ...action.files] };
    case 'UPDATE':
      return {
        files: state.files.map(f => (f.id === action.id ? { ...f, ...action.patch } : f)),
      };
    case 'REMOVE':
      return { files: state.files.filter(f => f.id !== action.id) };
    case 'SET_TAG':
      return {
        files: state.files.map(f => (f.id === action.id ? { ...f, tag: action.tag } : f)),
      };
    case 'RESET':
      return { files: [] };
    default:
      return state;
  }
}

function readableSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function useUploadManager(createdBy = 'User Test 4') {
  const [state, dispatch] = useReducer(reducer, { files: [] });
  const controllers = useRef(new Map<string, AbortController>());
  const timers = useRef(new Map<string, number>()); // setInterval ids

  const dedupeKey = (f: File) => `${f.name}::${f.size}`;
  const existingKeys = useMemo(
    () => new Set(state.files.map(f => `${f.name}::${f.size}`)),
    [state.files]
  );

  const validateIncoming = (files: File[]) => {
    const accepted: File[] = [];
    const rejected: { file: File; reason: string }[] = [];

    for (const f of files) {
      if (existingKeys.has(dedupeKey(f))) {
        rejected.push({ file: f, reason: 'Duplicate file (name + size)' });
        continue;
      }
      if (!ALLOWED_TYPES.includes(f.type)) {
        rejected.push({ file: f, reason: `Type not allowed: ${f.type}` });
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        rejected.push({ file: f, reason: `File too large: ${readableSize(f.size)}` });
        continue;
      }
      accepted.push(f);
    }

    const totalAfter = state.files.length + accepted.length;
    if (totalAfter > MAX_FILES) {
      const allowedLeft = Math.max(0, MAX_FILES - state.files.length);
      // solo toma los primeros permitidos
      const cut = accepted.slice(0, allowedLeft);
      const remainder = accepted.slice(allowedLeft);
      remainder.forEach(file => rejected.push({ file, reason: `Max files: ${MAX_FILES}` }));
      return { accepted: cut, rejected };
    }

    return { accepted, rejected };
  };

  const addFiles = useCallback((raw: File[] | FileList) => {
    const files = Array.from(raw as File[]);
    const { accepted, rejected } = validateIncoming(files);

    const descriptors: FileDescriptor[] = accepted.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      status: 'idle',
      progress: 0,
      createdAt: new Date().toISOString(),
      createdBy,
    }));

    // Agregar todos los aceptados como 'uploading' y lanzar subida
    dispatch({ type: 'ADD', files: descriptors });
    descriptors.forEach((d, idx) => startUpload(d, accepted[idx]));
    // Mapear rechazados como entradas de error (si quieres mostrarlos en lista):
    rejected.forEach(({ file, reason }) => {
      const id = crypto.randomUUID();
      dispatch({
        type: 'ADD',
        files: [{
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'error',
          progress: 0,
          error: reason,
          createdAt: new Date().toISOString(),
          createdBy,
        }],
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdBy, state.files.length, existingKeys]);

  const startUpload = useCallback(async (d: FileDescriptor, file: File) => {
    // Marcar uploading
    dispatch({ type: 'UPDATE', id: d.id, patch: { status: 'uploading', progress: 0, error: undefined } });

    const controller = new AbortController();
    controllers.current.set(d.id, controller);

    // Simulación de progreso real con intervalos
    let p = 0;
    const tick = window.setInterval(() => {
      if (controller.signal.aborted) return;
      p = Math.min(99, p + Math.max(1, Math.round(Math.random() * 12)));
      dispatch({ type: 'UPDATE', id: d.id, patch: { progress: p } });
    }, 250);
    timers.current.set(d.id, tick as unknown as number);

    try {
      // Simula llamada al backend (20% falla)
      const fail = Math.random() < 0.2;
      await new Promise((res, rej) => setTimeout(fail ? rej : res, 1200 + Math.random() * 1200));
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');

      // POST /api/upload (mock)
      const resp = await fetch('/api/upload', {
        method: 'POST',
        signal: controller.signal,
        body: file, // no se usa realmente en el mock
      });
      if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
      const { id, url } = await resp.json();

      dispatch({
        type: 'UPDATE',
        id: d.id,
        patch: { status: 'done', progress: 100, url: url || `/uploads/${id}` },
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        dispatch({ type: 'UPDATE', id: d.id, patch: { status: 'canceled', error: 'Upload canceled' } });
      } else {
        dispatch({ type: 'UPDATE', id: d.id, patch: { status: 'error', error: err?.message || 'Upload error' } });
      }
    } finally {
      // limpiar interval y controller
      const t = timers.current.get(d.id);
      if (t) window.clearInterval(t);
      timers.current.delete(d.id);
      controllers.current.delete(d.id);
    }
  }, []);

  const cancel = useCallback((id: string) => {
    const controller = controllers.current.get(id);
    if (controller) controller.abort();
  }, []);

  const remove = useCallback((id: string) => {
    // Si está subiendo → cancelar primero
    cancel(id);
    dispatch({ type: 'REMOVE', id });
  }, [cancel]);

  const retry = useCallback((id: string, original?: File) => {
    // Mantener metadata: name/size/type del descriptor existente.
    const target = state.files.find(f => f.id === id);
    if (!target) return;
    dispatch({ type: 'UPDATE', id, patch: { status: 'idle', progress: 0, error: undefined } });
    // Necesitamos un File real; si no lo tenemos, no podemos re-subir de verdad.
    // En una app real lo guardarías en memoria o pedirías seleccionar de nuevo.
    if (original) {
      startUpload(target, original);
    } else {
      // Simular reintento sin File real:
      const fakeBlob = new Blob(['retry'], { type: target.type });
      const fakeFile = new File([fakeBlob], target.name, { type: target.type, lastModified: Date.now() });
      startUpload(target, fakeFile);
    }
  }, [state.files, startUpload]);

  const setTag = useCallback((id: string, tag: string) => {
    dispatch({ type: 'SET_TAG', id, tag });
  }, []);

  const resetAll = useCallback(() => {
    // cancelar todos
    controllers.current.forEach(c => c.abort());
    timers.current.forEach(t => window.clearInterval(t));
    controllers.current.clear();
    timers.current.clear();
    dispatch({ type: 'RESET' });
  }, []);

  const pendingCount = state.files.filter(f => f.status !== 'done').length;
  const uploadingCount = state.files.filter(f => f.status === 'uploading').length;

  return {
    files: state.files,
    addFiles,
    remove,
    cancel,
    retry,
    setTag,
    resetAll,
    pendingCount,
    uploadingCount,
  };
}