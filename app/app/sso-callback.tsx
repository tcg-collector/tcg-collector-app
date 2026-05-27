import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';

/**
 * Página de callback do OAuth no web.
 * Após o Google redirecionar de volta, o Clerk processa o token aqui
 * e redireciona para a tela principal.
 */
export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();

  useEffect(() => {
    handleRedirectCallback({
      afterSignInUrl: '/',
      afterSignUpUrl: '/',
    } as any).catch(() => {
      router.replace('/sign-in' as any);
    });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.void, gap: 16 }}>
      <ActivityIndicator color={Colors.gold} size="large" />
      <Text style={{ color: Colors.ash, fontSize: 14 }}>Finalizando login...</Text>
    </View>
  );
}
