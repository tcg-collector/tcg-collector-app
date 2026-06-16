import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const COND_MULT: Record<string, number> = { NM: 1, LP: 0.8, MP: 0.6, HP: 0.4, DMG: 0.2 };

function formatBRL(value: number): string {
  const [i, d] = value.toFixed(2).split('.');
  return `R$ ${i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${d}`;
}

interface BinderSlot {
  cardId?: string | null;
  condition: string;
  card?: { prices?: { holofoil?: { market?: number | null }; normal?: { market?: number | null } } } | null;
}

interface Binder {
  _id: string;
  name: string;
  gridConfig: string;
  slots: BinderSlot[];
}

interface Props {
  binder: Binder;
  rate: number | null;
  onPress: () => void;
  onLongPress: () => void;
}

export function BinderListItem({ binder, rate, onPress, onLongPress }: Props) {
  const filled = binder.slots.filter(s => s.cardId).length;
  const total = binder.slots.length;
  const progress = total > 0 ? filled / total : 0;

  const valueUSD = binder.slots.reduce((sum, s) => {
    if (!s.cardId || !s.card) return sum;
    const base = s.card.prices?.holofoil?.market ?? s.card.prices?.normal?.market ?? 0;
    return sum + base * (COND_MULT[s.condition] ?? 1);
  }, 0);
  const valueBRL = rate ? valueUSD * rate : null;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{binder.name}</Text>
        <Text style={styles.meta}>{binder.gridConfig} · {filled}/{total} slots</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
      </View>
      <View style={styles.right}>
        {valueBRL !== null
          ? <Text style={styles.value}>{formatBRL(valueBRL)}</Text>
          : <Text style={styles.noValue}>—</Text>
        }
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.snow },
  meta: { fontSize: 12, color: Colors.ash },
  progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginTop: 2 },
  progressFill: { height: 4, backgroundColor: Colors.gold, borderRadius: 2 },
  right: { alignItems: 'flex-end' },
  value: { fontSize: 14, fontWeight: '700', color: Colors.gold },
  noValue: { fontSize: 14, color: Colors.ash },
});
