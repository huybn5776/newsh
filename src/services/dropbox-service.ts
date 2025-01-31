import { Dropbox, DropboxAuth, files as DropboxFiles } from 'dropbox';

import { SettingEventType } from '@/enums/setting-event-type';
import { SettingKey } from '@/enums/setting-key';
import { DropboxApiError } from '@/interfaces/dropbox-api-error';
import { DropboxTokenInfo } from '@/interfaces/dropbox-token-info';
import { saveSettingToStorage, getSettingFromStorage } from '@/services/setting-service';
import { readBlobAsJson } from '@/utils/browser-utils';

export type DropboxFile = DropboxFiles.FileMetadata & { fileBlob: Blob };

let globalDbx: Dropbox;
let globalDbxAuth: DropboxAuth;

export function getDropbox(): Dropbox {
  if (!globalDbx) {
    globalDbx = new Dropbox({ clientId: getClientId(), auth: getDropboxAuth() });
  }
  return globalDbx;
}

export function getDropboxAuth(): DropboxAuth {
  if (!globalDbxAuth) {
    const dropboxToken = getSettingFromStorage(SettingKey.DropboxToken);
    globalDbxAuth = new DropboxAuth({
      clientId: getClientId(),
      ...dropboxToken,
      accessTokenExpiresAt: dropboxToken ? new Date(dropboxToken?.expiresAt) : undefined,
    });
  }
  return globalDbxAuth;
}

export async function createDropboxAuthUrl(redirectUri: string): Promise<string> {
  const dbxAuth = getDropboxAuth();
  const url = (await dbxAuth.getAuthenticationUrl(
    redirectUri,
    undefined,
    'code',
    'offline',
    undefined,
    undefined,
    true,
  )) as string;
  const codeVerifier = dbxAuth.getCodeVerifier();
  window.sessionStorage.clear();
  window.sessionStorage.setItem('dropboxCodeVerifier', codeVerifier);
  return url;
}

export async function getDropboxTokenFromAuthCode(redirectUri: string, authCode: string): Promise<DropboxTokenInfo> {
  const dbxAuth = getDropboxAuth();
  const codeVerifier = window.sessionStorage.getItem('dropboxCodeVerifier');
  dbxAuth.setCodeVerifier(codeVerifier!);
  const response = await dbxAuth.getAccessTokenFromCode(redirectUri, authCode);
  const result = response.result as Record<string, string>;

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + +result.expires_in);

  return {
    accessToken: result.access_token,
    accountId: result.account_id,
    expiresAt: expiresAt.getTime(),
    refreshToken: result.refresh_token,
    scope: result.scope.split(' '),
    tokenType: result.token_type,
    uid: result.uid,
  };
}

export function setTokenIntoDropboxAuth(token: DropboxTokenInfo): void {
  const dbxAuth = getDropboxAuth();
  dbxAuth.setAccessToken(token.accessToken);
  dbxAuth.setAccessTokenExpiresAt(new Date(token.expiresAt));
  dbxAuth.setRefreshToken(token.refreshToken);
}

export function getAuthCodeFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('code');
}

export function refreshDropboxTokenIfNeeded(): DropboxTokenInfo | null {
  const dbxAuth = getDropboxAuth();
  const orgToken = dbxAuth.getAccessToken();
  dbxAuth.checkAndRefreshAccessToken();
  const newToken = dbxAuth.getAccessToken();
  if (orgToken === newToken) {
    return null;
  }

  const updatedTokenInfo: DropboxTokenInfo = {
    ...getSettingFromStorage(SettingKey.DropboxToken)!,
    accessToken: newToken,
    expiresAt: dbxAuth.getAccessTokenExpiresAt().getTime(),
  };
  saveSettingToStorage(SettingKey.DropboxToken, updatedTokenInfo, SettingEventType.Sync);
  return updatedTokenInfo;
}

export async function saveJsonToDropbox(filename: string, contents: object): Promise<DropboxFiles.FileMetadata> {
  const dbx = getDropbox();
  const response = await dbx.filesUpload({
    path: `/${filename}`,
    contents: JSON.stringify(contents),
    mode: { '.tag': 'overwrite' },
  });
  return response.result;
}

export async function getJsonFromDropbox<T>(filename: string): Promise<T | null> {
  const file = await getFileFromDropbox(filename).catch((e) => {
    const error = e as DropboxApiError;
    const errorTag = error.error.error['.tag'];
    if (errorTag === 'path') {
      return null;
    }
    throw error;
  });
  return file ? readBlobAsJson<T>(file.fileBlob) : null;
}

export async function getFileFromDropbox(filename: string): Promise<DropboxFile> {
  const dbx = getDropbox();
  const response = await dbx.filesDownload({ path: `/${filename}` });
  return response.result as DropboxFile;
}

function getClientId(): string {
  return import.meta.env.VITE_DROPBOX_CLIENT_ID as string;
}
