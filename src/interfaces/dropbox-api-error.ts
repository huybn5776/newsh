export interface DropboxApiError extends Error {
  status: number;
  error: DropboxError;
}

interface DropboxError {
  error_summary: string;
  error: { '.tag': string } & Record<string, string>;
}
