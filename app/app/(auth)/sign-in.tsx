import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSignIn, useSignUp, useOAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

type Mode = 'sign-in' | 'sign-up';

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function SignInScreen() {
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificação OTP
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const isLoaded = signInLoaded && signUpLoaded;

  // Login / Cadastro com e-mail e senha
  const handleEmailAuth = async () => {
    if (!isLoaded || loading) return;
    if (!email.trim() || !password.trim()) {
      showAlert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'sign-in') {
        const result = await signIn!.create({ identifier: email.trim(), password });
        await setActiveSignIn!({ session: result.createdSessionId });
      } else {
        // Cria a conta e envia o código por e-mail
        await signUp!.create({ emailAddress: email.trim(), password });
        await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPendingVerification(true); // mostra tela de OTP
      }
    } catch (e: any) {
      const msg = e?.errors?.[0]?.message ?? e?.message ?? 'Erro na autenticação';
      showAlert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  // Verifica o código OTP que chegou no e-mail
  const handleVerifyCode = async () => {
    if (!isLoaded || loading || !code.trim()) return;
    setLoading(true);
    try {
      const result = await signUp!.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status === 'complete') {
        await setActiveSignUp!({ session: result.createdSessionId });
      } else {
        showAlert('Erro', 'Verificação incompleta. Tente novamente.');
      }
    } catch (e: any) {
      const msg = e?.errors?.[0]?.message ?? e?.message ?? 'Código inválido';
      showAlert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  // Login com Google
  const handleGoogle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        await signIn!.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: window.location.origin + '/sso-callback',
          redirectUrlComplete: '/',
        });
      } else {
        const redirectUrl = Linking.createURL('/(tabs)', { scheme: 'tcgbindex' });
        const { createdSessionId, setActive } = await startOAuthFlow({ redirectUrl });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        }
        setLoading(false);
      }
    } catch (e: any) {
      const msg = e?.errors?.[0]?.message ?? e?.message ?? 'Erro ao entrar com Google';
      showAlert('Erro', msg);
      setLoading(false);
    }
  };

  // ── Tela de verificação OTP ──────────────────────────────────────────────
  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>📧</Text>
            <Text style={styles.appName}>Verifique seu e-mail</Text>
            <Text style={styles.tagline}>
              Enviamos um código de 6 dígitos para{'\n'}{email}
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="000000"
              placeholderTextColor={Colors.ash}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleVerifyCode}
              disabled={loading || code.length < 6}
            >
              {loading
                ? <ActivityIndicator color={Colors.void} />
                : <Text style={styles.primaryBtnTxt}>Verificar código</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              setPendingVerification(false);
              setCode('');
            }}
          >
            <Text style={styles.backLink}>← Voltar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Tela principal de login/cadastro ─────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🃏</Text>
          <Text style={styles.appName}>TCG Bindex</Text>
          <Text style={styles.tagline}>Seu binder digital</Text>
        </View>

        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'sign-in' && styles.modeTabActive]}
            onPress={() => setMode('sign-in')}
          >
            <Text style={[styles.modeTabTxt, mode === 'sign-in' && styles.modeTabTxtActive]}>
              Entrar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'sign-up' && styles.modeTabActive]}
            onPress={() => setMode('sign-up')}
          >
            <Text style={[styles.modeTabTxt, mode === 'sign-up' && styles.modeTabTxtActive]}>
              Criar conta
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor={Colors.ash}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={Colors.ash}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleEmailAuth}
            disabled={loading || !isLoaded}
          >
            {loading
              ? <ActivityIndicator color={Colors.void} />
              : <Text style={styles.primaryBtnTxt}>
                  {mode === 'sign-in' ? 'Entrar' : 'Criar conta'}
                </Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerTxt}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={loading}>
          <Ionicons name="logo-google" size={20} color={Colors.snow} />
          <Text style={styles.googleBtnTxt}>Continuar com Google</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.void },
  content:          { flex: 1, justifyContent: 'center', padding: 28, gap: 20 },
  header:           { alignItems: 'center', gap: 6, marginBottom: 8 },
  logo:             { fontSize: 56 },
  appName:          { fontSize: 28, fontWeight: '800', color: Colors.snow },
  tagline:          { fontSize: 14, color: Colors.ash, textAlign: 'center', lineHeight: 20 },
  modeTabs:         { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, padding: 4, gap: 4 },
  modeTab:          { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  modeTabActive:    { backgroundColor: Colors.surface2 },
  modeTabTxt:       { fontSize: 14, fontWeight: '600', color: Colors.ash },
  modeTabTxtActive: { color: Colors.gold },
  form:             { gap: 12 },
  input:            { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, color: Colors.snow, fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  codeInput:        { fontSize: 28, fontWeight: '700', textAlign: 'center', letterSpacing: 8 },
  primaryBtn:       { backgroundColor: Colors.gold, borderRadius: 12, padding: 16, alignItems: 'center' },
  primaryBtnTxt:    { fontSize: 16, fontWeight: '700', color: Colors.void },
  divider:          { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine:      { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerTxt:       { fontSize: 13, color: Colors.ash },
  googleBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  googleBtnTxt:     { fontSize: 15, fontWeight: '600', color: Colors.snow },
  backLink:         { textAlign: 'center', color: Colors.ash, fontSize: 14 },
});
