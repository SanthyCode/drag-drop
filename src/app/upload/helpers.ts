import * as Yup from 'yup';

export const ALLOWED_TYPES = ['application/pdf'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILES = 10;
export const MIN_FILES = 1;

export const uploadSchema = Yup.object({
  title: Yup.string().trim().required('Title is required'),
  description: Yup.string().trim().required('Description is required'),
});