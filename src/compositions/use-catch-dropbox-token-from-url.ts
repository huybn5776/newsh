import { onMounted, ref, Ref } from 'vue';

import { useRoute, useRouter } from 'vue-router';

import { DropboxTokenInfo } from '@/interfaces/dropbox-token-info';
import { getAuthCodeFromUrl, getDropboxTokenFromAuthCode, setTokenIntoDropboxAuth } from '@/services/dropbox-service';

export function useCatchDropboxTokenFromUrl(onToken: (token: DropboxTokenInfo) => void): { loading: Ref<boolean> } {
  const route = useRoute();
  const router = useRouter();
  const loading = ref(false);

  onMounted(async () => {
    const authCode = getAuthCodeFromUrl();
    if (!authCode) {
      return;
    }
    await router.push({ params: {} });
    const redirectUri = `${window.location.origin}${route.path}`;

    loading.value = true;
    const tokenInfo = await getDropboxTokenFromAuthCode(redirectUri, authCode);
    loading.value = false;

    setTokenIntoDropboxAuth(tokenInfo);
    onToken(tokenInfo);
  });

  return { loading };
}
