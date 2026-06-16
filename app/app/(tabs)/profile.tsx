import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useUser, useClerk } from '@clerk/clerk-expo';

// ── componentes ──────────────────────────────────────────────────────────────

interface SettingRowProps {
  icon:        React.ComponentProps<typeof Ionicons>['name'];
  label:       string;
  value?:      string;
  danger?:     boolean;
  comingSoon?: boolean;
  onPress?:    () => void;
}

function SettingRow({ icon, label, value, danger, comingSoon, onPress }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={comingSoon ? 1 : 0.7}
      disabled={comingSoon}
    >
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? Colors.crimson : Colors.ash} />
      </View>
      <Text style={[styles.settingLabel, danger && { color: Colors.crimson }]}>{label}</Text>
      <View style={styles.settingRight}>
        {comingSoon ? (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Em breve</Text>
          </View>
        ) : value !== undefined ? (
          <Text style={styles.settingValue}>{value}</Text>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={Colors.ash} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── tela principal ────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const avatarLetter = email.charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>
        <Text style={styles.email} numberOfLines={1}>{email}</Text>
        <View style={styles.planBadge}>
          <Ionicons name="flash" size={12} color={Colors.gold} />
          <Text style={styles.planText}>Plano Gratuito</Text>
        </View>
      </View>

      {/* Configurações */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coleção</Text>
        <SettingRow icon="pricetag-outline"       label="Moeda"            value="BRL" />
        <SettingRow icon="sync-outline"           label="Sync de preços"   value="Diário" />
        <SettingRow icon="cloud-download-outline" label="Exportar coleção" comingSoon />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conta</Text>
        <SettingRow icon="trending-up-outline"        label="Alerta de alta"      comingSoon />
        <SettingRow icon="trending-down-outline"      label="Alerta de baixa"     comingSoon />
        <SettingRow icon="diamond-outline"            label="Assinar Bindex Pro"  comingSoon />
        <SettingRow icon="help-circle-outline"        label="Ajuda & Suporte"     comingSoon />
        <SettingRow icon="information-circle-outline" label="Sobre o app"         value="v1.0.0" />
        <SettingRow icon="log-out-outline"            label="Sair" danger onPress={() => signOut()} />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.void },
  hero:             { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  avatar:           { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:       { fontSize: 28, fontWeight: '800', color: Colors.void },
  email:            { fontSize: 13, color: Colors.ash, marginBottom: 12 },
  planBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.gold + '20', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.gold + '40' },
  planText:         { fontSize: 12, fontWeight: '600', color: Colors.gold },
  section:          { marginHorizontal: 20, marginBottom: 16, backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  sectionTitle:     { fontSize: 11, fontWeight: '700', color: Colors.ash, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },

  // Settings
  settingRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: 1, borderTopColor: Colors.border, gap: 12 },
  settingIcon:      { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  settingIconDanger:{ backgroundColor: Colors.crimson + '20' },
  settingLabel:     { flex: 1, fontSize: 15, color: Colors.snow, fontWeight: '500' },
  settingRight:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue:     { fontSize: 13, color: Colors.ash },
  comingSoonBadge:  { backgroundColor: Colors.gold + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.gold + '40' },
  comingSoonText:   { fontSize: 11, fontWeight: '600', color: Colors.gold },
});
