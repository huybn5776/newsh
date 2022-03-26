export interface DropboxTokenInfo {
  accessToken: string;
  accountId: string;
  expiresAt: number;
  refreshToken: string;
  scope: string[];
  tokenType: string;
  uid: string;
}
