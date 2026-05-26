import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useBinders } from '../../hooks/useBinders';
import { useCollection } from '../../hooks/useCollection';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { GRID_CONFIGS } from '../../services/binders';

function formatBRL(value: number): string {
  const fixed = value.toFixed(2);
  const [i, d] = fixed.split('.');
  return `R$ ${i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${d}`;
}

export default function CollectionScreen() {
  const router = useRouter();
  const { binders, loading: loadingBinders, deleteBinder } = useBinders();
  const { items, loading: loadingLoose, totalCards, totalValueUSD } = useCollection();
  const { rate } = useExchangeRate();

  const looseOnly = items.filter(i => true); // avulso = tudo sem binder por enquanto
  const totalBRL = rate ? totalValueUSD * rate : 0;

  const handleDeleteBinder = (id: string, name: string) => {
    Alert.alert('Excluir binder', `Excluir "${name}"? As cartas não serão deletadas.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteBinder(id) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Resumo geral */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatBRL(totalBRL)}</Text>
          <Text style={styles.summaryLabel}>Valor total</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalCards}</Text>
          <Text style={styles.summaryLabel}>Cartas</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{binders.length}</Text>
          <Text style={styles.summaryLabel}>Binders</Text>
        </View>
      </View>

      {/* Seção Binders */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Meus binders</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/binder/create')}
        >
          <Ionicons name="add" size={18} color={Colors.void} />
          <Text style={styles.addBtnText}>Novo</Text>
        </TouchableOpacity>
      </View>

      {loadingBinders ? (
        <ActivityIndicator color={Colors.gold} style={{ marginVertical: 20 }} />
      ) : binders.length === 0 ? (
        <TouchableOpacity style={styles.emptyBinder} onPress={() => router.push('/binder/create')}>
          <Ionicons name="book-outline" size={32} color={Colors.ash} />
          <Text style={styles.emptyText}>Crie seu primeiro binder</Text>
          <Text style={styles.emptyHint}>Organize suas cartas como um binder físico</Text>
        </TouchableOpacity>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bindersRow}>
          {binders.map(b => {
            const cfg = GRID_CONFIGS.find(g => g.value === b.gridConfig) ?? GRID_CONFIGS[1];
            const filled = b.slots.filter(s => s.cardId).length;
            const total = b.slots.length;
            return (
              <TouchableOpacity
                key={b._id}
                style={styles.binderCard}
                onPress={() => router.push(`/binder/${b._id}`)}
                onLongPress={() => handleDeleteBinder(b._id, b.name)}
              >
                {b.coverPhotoUrl ? (
                  <Image source={{ uri: b.coverPhotoUrl }} style={styles.binderCover} resizeMode="cover" />
                ) : (
                  <View style={[styles.binderCover, styles.binderCoverEmpty]}>
                    <View style={styles.gridPreview}>
                      {b.slots.slice(0, cfg.cols * cfg.rows).map((s, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.gridCell,
                            { width: `${100 / cfg.cols - 4}%` as any },
                            s.cardId ? styles.gridCellFilled : styles.gridCellEmpty,
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                )}
                <View style={styles.binderInfo}>
                  <Text style={styles.binderName} numberOfLines={1}>{b.name}</Text>
                  <Text style={styles.binderMeta}>{cfg.label} · {filled}/{total}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Seção Avulso */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Avulso</Text>
        <Text style={styles.sectionCount}>{looseOnly.length} cartas</Text>
      </View>

      {loadingLoose ? (
        <ActivityIndicator color={Colors.gold} style={{ marginVertical: 20 }} />
      ) : looseOnly.length === 0 ? (
        <View style={styles.emptyLoose}>
          <Text style={styles.emptyText}>Nenhuma carta avulsa</Text>
        </View>
      ) : (
        <View style={styles.looseGrid}>
          {looseOnly.map(item => {
            const card = typeof item.cardId === 'object' ? item.cardId : null;
            return (
              <TouchableOpacity
                key={item._id}
                style={styles.looseCard}
                onPress={() => card && router.push(`/card/${card._id}`)}
              >
                {card?.images?.small ? (
                  <Image source={{ uri: card.images.small }} style={styles.looseCardImg} resizeMode="contain" />
                ) : (
                  <View style={[styles.looseCardImg, styles.looseCardImgEmpty]}>
                    <Ionicons name="image-outline" size={24} color={Colors.ash} />
                  </View>
                )}
                <Text style={styles.looseCardName} numberOfLines={1}>{card?.name ?? '—'}</Text>
                <View style={styles.condBadge}>
                  <Text style={styles.condText}>{item.condition}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.void },
  content:     { paddingBottom: 40 },
  summary:     { flexDirection: 'row', backgroundColor: Colors.surface, marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16, justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue:{ fontSize: 16, fontWeight: '700', color: Colors.snow },
  summaryLabel:{ fontSize: 11, color: Colors.ash, marginTop: 2 },
  divider:     { width: 1, backgroundColor: Colors.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  sectionTitle:  { fontSize: 17, fontWeight: '700', color: Colors.snow },
  sectionCount:  { fontSize: 13, color: Colors.ash },
  addBtn:        { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gold, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
  addBtnText:    { fontSize: 13, fontWeight: '700', color: Colors.void },
  bindersRow:    { paddingHorizontal: 16, gap: 12 },
  binderCard:    { width: 140 },
  binderCover:   { width: 140, height: 180, borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  binderCoverEmpty: { backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  gridPreview:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 10, width: '100%' },
  gridCell:      { aspectRatio: 0.72, borderRadius: 3 },
  gridCellFilled:{ backgroundColor: Colors.gold + '66' },
  gridCellEmpty: { backgroundColor: Colors.border + '88' },
  binderInfo:    { gap: 2 },
  binderName:    { fontSize: 13, fontWeight: '600', color: Colors.snow },
  binderMeta:    { fontSize: 11, color: Colors.ash },
  emptyBinder:   { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 14, padding: 32, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyLoose:    { marginHorizontal: 16, padding: 24, alignItems: 'center' },
  emptyText:     { fontSize: 14, color: Colors.ash },
  emptyHint:     { fontSize: 12, color: Colors.border, textAlign: 'center' },
  looseGrid:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  looseCard:     { width: '30%', backgroundColor: Colors.surface, borderRadius: 10, padding: 8, alignItems: 'center' },
  looseCardImg:  { width: '100%', aspectRatio: 0.72, borderRadius: 6, marginBottom: 6 },
  looseCardImgEmpty: { backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  looseCardName: { fontSize: 11, color: Colors.snow, textAlign: 'center' },
  condBadge:     { backgroundColor: Colors.surface2, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  condText:      { fontSize: 10, fontWeight: '700', color: Colors.ash },
});
