import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useBinders } from '@/hooks/useBinders';
import { useCollection } from '@/hooks/useCollection';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import type { BinderSlot } from '@/services/binders';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatBRL(v: number) {
  const [i, d] = v.toFixed(2).split('.');
  return `R$ ${i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${d}`;
}

const CONDITION_MULT: Record<string, number> = {
  NM: 1.0, LP: 0.8, MP: 0.6, HP: 0.4, DMG: 0.2,
};

const CONDITION_COLOR: Record<string, string> = {
  NM: Colors.mint, LP: '#86efac', MP: Colors.gold,
  HP: Colors.ember, DMG: Colors.crimson,
};

// ── hook de estatísticas ─────────────────────────────────────────────────────

function useCollectionStats() {
  const { binders, loading: loadingBinders } = useBinders();
  const { items: looseItems, loading: loadingLoose, totalValueUSD: looseValueUSD } = useCollection();
  const { rate } = useExchangeRate();

  if (loadingBinders || loadingLoose || !rate) return { loading: true, stats: null };

  // Todos os slots com carta (binders)
  const allSlots: (BinderSlot & { binderName: string })[] = [];
  for (const b of binders) {
    for (const s of b.slots) {
      if (s.cardId && s.card) allSlots.push({ ...s, binderName: b.name });
    }
  }

  const binderCardsCount = allSlots.length;
  const binderCount = binders.length;

  // Valor total binders
  let binderValue = 0;
  for (const s of allSlots) {
    const base = s.card!.prices?.holofoil?.market ?? s.card!.prices?.normal?.market ?? 0;
    binderValue += (base ?? 0) * (CONDITION_MULT[s.condition] ?? 1) * rate;
  }

  // Totais combinados (binders + avulso)
  const totalCards = binderCardsCount + looseItems.length;
  const totalValue = binderValue + looseValueUSD * rate;

  // Distribuição por condição (binders)
  const condCount: Record<string, number> = { NM: 0, LP: 0, MP: 0, HP: 0, DMG: 0 };
  for (const s of allSlots) condCount[s.condition] = (condCount[s.condition] ?? 0) + 1;

  // Top 5 cartas mais valiosas (binders)
  const topCards = [...allSlots]
    .map(s => {
      const base = s.card!.prices?.holofoil?.market ?? s.card!.prices?.normal?.market ?? 0;
      const value = (base ?? 0) * (CONDITION_MULT[s.condition] ?? 1) * rate;
      return { ...s, valueBRL: value };
    })
    .filter(s => s.valueBRL > 0)
    .sort((a, b) => b.valueBRL - a.valueBRL)
    .slice(0, 5);

  // Sets mais presentes (binders)
  const setCount: Record<string, number> = {};
  for (const s of allSlots) {
    const setName = s.card!.set?.name ?? 'Desconhecido';
    setCount[setName] = (setCount[setName] ?? 0) + 1;
  }
  const topSets = Object.entries(setCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return {
    loading: false,
    stats: { totalValue, totalCards, binderCount, condCount, topCards, topSets },
  };
}

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
  const { loading, stats } = useCollectionStats();
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

      {loading || !stats ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.gold} />
          <Text style={{ color: Colors.ash, marginTop: 8 }}>Calculando coleção...</Text>
        </View>
      ) : (
        <>
          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="albums" size={20} color={Colors.gold} />
              <Text style={styles.statValue}>{stats.totalCards}</Text>
              <Text style={styles.statLabel}>Cartas</Text>
            </View>
            <View style={[styles.statItem, styles.statItemBorder]}>
              <Ionicons name="cash" size={20} color={Colors.gold} />
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatBRL(stats.totalValue)}
              </Text>
              <Text style={styles.statLabel}>Valor total</Text>
            </View>
            <View style={[styles.statItem, styles.statItemBorder]}>
              <Ionicons name="folder" size={20} color={Colors.gold} />
              <Text style={styles.statValue}>{stats.binderCount}</Text>
              <Text style={styles.statLabel}>Binders</Text>
            </View>
          </View>

          {/* Distribuição por condição */}
          {stats.totalCards > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Distribuição por condição</Text>
              {Object.entries(stats.condCount)
                .filter(([, n]) => n > 0)
                .map(([cond, count]) => {
                  const pct = Math.round((count / stats.totalCards) * 100);
                  return (
                    <View key={cond} style={styles.condRow}>
                      <Text style={styles.condGrade}>{cond}</Text>
                      <View style={styles.condBarBg}>
                        <View style={[
                          styles.condBarFill,
                          { width: `${pct}%` as any, backgroundColor: CONDITION_COLOR[cond] },
                        ]} />
                      </View>
                      <Text style={styles.condCount}>{count} ({pct}%)</Text>
                    </View>
                  );
                })}
            </View>
          )}

          {/* Top cartas mais valiosas */}
          {stats.topCards.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cartas mais valiosas</Text>
              {stats.topCards.map((s, i) => (
                <View key={`${s.cardId}-${i}`} style={styles.topCardRow}>
                  <Text style={styles.topCardRank}>#{i + 1}</Text>
                  {s.card!.images?.small && (
                    <Image source={{ uri: s.card!.images.small }} style={styles.topCardImg} resizeMode="contain" />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topCardName} numberOfLines={1}>{s.card!.name}</Text>
                    <Text style={styles.topCardSet} numberOfLines={1}>{s.card!.set?.name}</Text>
                    <View style={styles.topCardMeta}>
                      <View style={[styles.condBadge, { backgroundColor: CONDITION_COLOR[s.condition] + '30' }]}>
                        <Text style={[styles.condBadgeTxt, { color: CONDITION_COLOR[s.condition] }]}>{s.condition}</Text>
                      </View>
                      <Text style={styles.topCardBinder}>{s.binderName}</Text>
                    </View>
                  </View>
                  <Text style={styles.topCardValue}>{formatBRL(s.valueBRL)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Sets mais presentes */}
          {stats.topSets.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sets na coleção</Text>
              {stats.topSets.map(([setName, count]) => (
                <View key={setName} style={styles.setRow}>
                  <Ionicons name="layers-outline" size={16} color={Colors.ash} />
                  <Text style={styles.setName} numberOfLines={1}>{setName}</Text>
                  <Text style={styles.setCount}>{count} carta{count > 1 ? 's' : ''}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Coleção vazia */}
          {stats.totalCards === 0 && (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 40 }}>🃏</Text>
              <Text style={styles.emptyTxt}>Sua coleção está vazia</Text>
              <Text style={styles.emptyHint}>Adicione cartas em um binder para ver as estatísticas aqui</Text>
            </View>
          )}
        </>
      )}

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
  loadingBox:       { alignItems: 'center', paddingVertical: 40 },
  statsGrid:        { flexDirection: 'row', marginHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 14, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  statItem:         { flex: 1, alignItems: 'center', padding: 16, gap: 4 },
  statItemBorder:   { borderLeftWidth: 1, borderLeftColor: Colors.border },
  statValue:        { fontSize: 15, fontWeight: '700', color: Colors.snow },
  statLabel:        { fontSize: 10, color: Colors.ash },
  section:          { marginHorizontal: 20, marginBottom: 16, backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  sectionTitle:     { fontSize: 11, fontWeight: '700', color: Colors.ash, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },

  // Condições
  condRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 7 },
  condGrade:        { fontSize: 12, fontWeight: '700', color: Colors.snow, width: 32 },
  condBarBg:        { flex: 1, height: 6, backgroundColor: Colors.surface2, borderRadius: 3, overflow: 'hidden' },
  condBarFill:      { height: '100%', borderRadius: 3 },
  condCount:        { fontSize: 11, color: Colors.ash, width: 68, textAlign: 'right' },

  // Top cartas
  topCardRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  topCardRank:      { fontSize: 12, fontWeight: '700', color: Colors.ash, width: 22 },
  topCardImg:       { width: 36, height: 50, borderRadius: 4 },
  topCardName:      { fontSize: 13, fontWeight: '600', color: Colors.snow },
  topCardSet:       { fontSize: 11, color: Colors.ash, marginTop: 1 },
  topCardMeta:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  condBadge:        { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  condBadgeTxt:     { fontSize: 10, fontWeight: '700' },
  topCardBinder:    { fontSize: 10, color: Colors.ash },
  topCardValue:     { fontSize: 13, fontWeight: '700', color: Colors.gold },

  // Sets
  setRow:           { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  setName:          { flex: 1, fontSize: 14, color: Colors.snow },
  setCount:         { fontSize: 12, color: Colors.ash },

  // Empty
  emptyBox:         { alignItems: 'center', padding: 32, gap: 8 },
  emptyTxt:         { fontSize: 16, fontWeight: '600', color: Colors.snow },
  emptyHint:        { fontSize: 13, color: Colors.ash, textAlign: 'center' },

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
