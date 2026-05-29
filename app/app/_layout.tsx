import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { Colors } from '@/constants/colors';
import { setAuthToken, setTokenGetter } from '@/services/api';

SplashScreen.preventAutoHideAsync();

// Cache de tokens: localStorage no web, SecureStore no mobile
const tokenCache = Platform.OS === 'web'
  ? {
      async getToken(key: string) {
        try { return localStorage.getItem(key); } catch { return null; }
      },
      async saveToken(key: string, value: string) {
        try { localStorage.setItem(key, value); } catch {}
      },
      async clearToken(key: string) {
        try { localStorage.removeItem(key); } catch {}
      },
    }
  : (() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const SecureStore = require('expo-secure-store');
      return {
        async getToken(key: string) {
          try { return await SecureStore.getItemAsync(key); } catch { return null; }
        },
        async saveToken(key: string, value: string) {
          try { await SecureStore.setItemAsync(key, value); } catch {}
        },
        async clearToken(key: string) {
          try { await SecureStore.deleteItemAsync(key); } catch {}
        },
      };
    })();

// Guard de autenticação — redireciona para login se não autenticado
function AuthGuard() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Mantém o token da API atualizado
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setAuthToken(null);
      setTokenGetter(null);
      return;
    }
    // Busca o token imediatamente e armazena no cache
    getToken().then(setAuthToken);
    // Guarda o getter para refresh automático quando o cache estiver vazio
    setTokenGetter(getToken);
    // Renovar token a cada 50 minutos (Clerk tokens duram 60 min)
    const interval = setInterval(() => {
      getToken().then(setAuthToken);
    }, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, getToken]);

  // Redirecionar baseado no estado de autenticação
  useEffect(() => {
    if (!isLoaded) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn, segments]);

  useEffect(() => { SplashScreen.hideAsync(); }, []);

  return null;
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthGuard />
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle:      { backgroundColor: Colors.surface },
            headerTintColor:  Colors.snow,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle:     { backgroundColor: Colors.void },
          }}
        >
          <Stack.Screen name="(auth)"  options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)"  options={{ headerShown: false }} />
          <Stack.Screen name="binder/create" options={{ title: 'Novo Binder', headerBackTitle: 'Voltar' }} />
          <Stack.Screen name="binder/[id]"   options={{ headerShown: false }} />
          <Stack.Screen name="card/[id]"     options={{ title: '', headerBackTitle: 'Voltar' }} />
        </Stack>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
