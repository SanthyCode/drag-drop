'use client';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import styles from '../styles/UploadForm.module.css';
import Dropzone from './Dropzone';
import FileList from './FileList';
import { uploadSchema } from './helpers';
import { useUploadManager } from './useUploadManager';
import { SubmitPayload } from './types';

export default function UploadForm() {
  const {
    files, addFiles, remove, cancel, retry, setTag,
    pendingCount, uploadingCount, resetAll,
  } = useUploadManager('User Test 4');

  const initialValues = { title: '', description: '' };
  const allDone = files.length > 0 && files.every(f => f.status === 'done');
  const canSubmit = allDone;

  return (
    <div className={styles.grid}>
      <div>
        <Formik
          initialValues={initialValues}
          validationSchema={uploadSchema}
          onSubmit={async (values, { resetForm }) => {
            const payload: SubmitPayload = {
              title: values.title,
              description: values.description,
              files: files
                .filter(f => f.status === 'done' && f.url)
                .map(f => ({ id: f.id, name: f.name, size: f.size, type: f.type, url: f.url! })),
            };
            console.log('Payload a enviar:', payload);

            const resp = await fetch('/api/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (resp.ok) {
              resetForm();
              resetAll();
              alert('Submitted!');
            } else {
              alert('Submit failed');
            }
          }}
        >
          {({ isValid }) => (
            <Form className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="title">Title</label>
                <Field id="title" name="title" placeholder="Enter a title" />
                <ErrorMessage component="div" className={styles.err} name="title" />
              </div>

              <div className={styles.field}>
                <label htmlFor="description">Description</label>
                <Field id="description" name="description" as="textarea" rows={3} placeholder="Describe your upload" />
                <ErrorMessage component="div" className={styles.err} name="description" />
              </div>

              <Dropzone onAdd={addFiles} totalCount={files.length} />

              {files.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.icon} aria-hidden>📂🔒</div>
                  <p>No files uploaded</p>
                </div>
              ) : (
                <FileList
                  files={files}
                  onRemove={remove}
                  onCancel={cancel}
                  onRetry={retry}
                  onTagChange={setTag}
                />
              )}

              <div className={styles.footer}>
                <div className={styles.status}>
                  <span>Pending: {pendingCount}</span>
                  <span>Uploading: {uploadingCount}</span>
                </div>
                <button
                  type="submit"
                  className={styles.submit}
                  disabled={!isValid || !canSubmit}
                >
                  Enviar
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>

      <aside>
        <div className={styles.help}>
          <h3>Help & Guidelines</h3>
          <ul>
            <li><b>Accepted:</b> PDF</li>
            <li><b>Max size:</b> 5MB each</li>
            <li><b>Max files:</b> 10</li>
            <li><b>Actions:</b> Cancel, Delete, Retry</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}