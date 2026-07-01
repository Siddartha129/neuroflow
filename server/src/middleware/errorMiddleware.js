export function errorMiddleware(error, req, res, next) {
  const isUploadSizeError = error.code === 'LIMIT_FILE_SIZE';
  const status = isUploadSizeError ? 400 : error.status || 500;
  const message = isUploadSizeError ? 'Upload must be 10MB or smaller' : status === 500 ? 'Internal server error' : error.message;

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({ message });
}
