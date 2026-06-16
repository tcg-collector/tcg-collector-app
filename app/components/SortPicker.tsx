import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Option<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export function SortPicker<T extends string>({ options, selected, onSelect }: Props<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map(opt => (
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
    backgroundColor: Colors.surface2,
    borderColor: Colors.gold,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.ash },
  chipTextActive: { color: Colors.gold },
});
