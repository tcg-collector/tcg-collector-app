import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

type Condition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
type ConditionFilter = 'ALL' | Condition;

const OPTIONS: { label: string; value: ConditionFilter }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'NM', value: 'NM' },
  { label: 'LP', value: 'LP' },
  { label: 'MP', value: 'MP' },
  { label: 'HP', value: 'HP' },
  { label: 'DMG', value: 'DMG' },
];

interface Props {
  selected: ConditionFilter;
  onSelect: (value: ConditionFilter) => void;
}

export function ConditionChips({ selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.chip, selected === opt.value && styles.chipActive]}
          onPress={() => onSelect(opt.value)}
        >
          <Text style={[styles.chipText, selected === opt.value && styles.chipTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.ash },
  chipTextActive: { color: Colors.void },
});
