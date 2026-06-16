import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';

const CONDITION_MULTIPLIERS: Record<CardCondition, number> = {
  NM: 1.00, LP: 0.80, MP: 0.60, HP: 0.40, DMG: 0.20,
};

const CONDITION_LABELS: Record<CardCondition, string> = {
  NM: 'Near Mint', LP: 'Lightly Played', MP: 'Moderately Played',
  HP: 'Heavily Played', DMG: 'Damaged',
};

function formatBRL(v: number): string {
  const [i, d] = v.toFixed(2).split('.');
  return `R$ ${i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${d}`;
}

interface Card {
  prices?: {
    holofoil?: { market?: number | null };
    normal?: { market?: number | null };
  };
}

function getBasePrice(card: Card): number | null {
  return card.prices?.holofoil?.market ?? card.prices?.normal?.market ?? null;
}

interface Props {
  card: Card;
  selected: CardCondition;
  onSelect: (c: CardCondition) => void;
  rate: number | null;
  hint?: string;
}

export function ConditionPicker({ card, selected, onSelect, rate, hint }: Props) {
  const hasPrice = getBasePrice(card) !== null;
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.condLabel}>Condição</Text>
      {hint ? <Text style={styles.condPickerHint}>{hint}</Text> : null}
      {(['NM', 'LP', 'MP', 'HP', 'DMG'] as CardCondition[]).map(c => {
        const base = getBasePrice(card);
        const price = base && rate ? formatBRL(base * CONDITION_MULTIPLIERS[c] * rate) : null;
        const isSelected = selected === c;
        return (
          <TouchableOpacity
            key={c}
            style={[styles.condRow, isSelected && styles.condRowActive]}
            onPress={() => onSelect(c)}
          >
            <View style={styles.condRowLeft}>
              <Text style={[styles.condGrade, isSelected && styles.condGradeActive]}>{c}</Text>
              <Text style={[styles.condName, isSelected && styles.condNameActive]}>{CONDITION_LABELS[c]}</Text>
            </View>
            {hasPrice
              ? <Text style={[styles.condPrice, isSelected && styles.condPriceActive]}>{price}</Text>
              : <Text style={styles.condNoPrice}>s/ preço</Text>
            }
          </TouchableOpacity>
        );
      })}
      {!hasPrice && (
        <Text style={styles.noPriceNote}>Esta carta não tem dados de preço no TCGPlayer</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  condLabel:       { fontSize: 13, fontWeight: '600', color: Colors.snow },
  condPickerHint:  { fontSize: 12, color: Colors.ash, marginBottom: 4 },
  condRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: 10, padding: 12, borderWidth: 1.5, borderColor: Colors.border },
  condRowActive:   { borderColor: Colors.gold, backgroundColor: Colors.surface2 },
  condRowLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  condGrade:       { fontSize: 13, fontWeight: '800', color: Colors.ash, width: 34 },
  condGradeActive: { color: Colors.gold },
  condName:        { fontSize: 13, color: Colors.ash },
  condNameActive:  { color: Colors.snow },
  condPrice:       { fontSize: 13, fontWeight: '700', color: Colors.ash },
  condPriceActive: { color: Colors.snow },
  condNoPrice:     { fontSize: 12, color: Colors.border },
  noPriceNote:     { fontSize: 11, color: Colors.ash, textAlign: 'center', fontStyle: 'italic' },
});
