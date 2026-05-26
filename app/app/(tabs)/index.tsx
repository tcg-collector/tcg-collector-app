import {
  View, Text, ScrollView, TouchableOpacity,
  FlatList, Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useCards } from '../../hooks/useCards';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import type { Card } from '../../services/cards';


function formatBRL(value: number): string {
  const fixed = value.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${intFormatted},${decPart}`;
}

function priceUSD(card: Card): number | null {
  return card.prices?.holofoil?.market
    ?? card.prices?.normal?.market
    ?? null;
}

function priceBRL(card: Card, rate: number | null): string {
  const usd = priceUSD(card);
  if (!usd || !rate) return '—';
  return `R$ ${formatBRL(usd * rate)}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { cards, loading: loadingCards } = useCards({ limit: 12 });
  const { rate, loading: loadingRate } = useExchangeRate();

  const featured = cards.filter(c => priceUSD(c) !== null).slice(0, 8);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, Matheus 👋</Text>
          <Text style={styles.subtitle}>Seu binder digital</Text>
        </View>
        <TouchableOpacity style={styles.bell}>
          <Ionicons name="notifications-outline" size={22} color={Colors.snow} />
        </TouchableOpacity>
      </View>

      {/* Market row */}
      <View style={styles.marketRow}>
        <View style={styles.marketCard}>
          <Ionicons name="trending-up" size={18} color={Colors.mint} />
          <Text style={[styles.marketValue, { color: Colors.mint }]}>+12,4%</Text>
          <Text style={styles.marketLabel}>Alta do dia</Text>
        </View>
        <View style={styles.marketCard}>
          <Ionicons name="trending-down" size={18} color={Colors.crimson} />
          <Text style={[styles.marketValue, { color: Colors.crimson }]}>-3,1%</Text>
          <Text style={styles.marketLabel}>Baixa do dia</Text>
        </View>
        <View style={styles.marketCard}>
          <Ionicons name="swap-horizontal" size={18} color={Colors.sky} />
          <Text style={[styles.marketValue, { color: Colors.sky }]}>
            {loadingRate ? '…' : `R$ ${rate?.toFixed(2)}`}
          </Text>
          <Text style={styles.marketLabel}>USD → BRL</Text>
        </View>
      </View>

      {/* Featured */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Em destaque</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/collection')}>
          <Text style={styles.seeAll}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      {loadingCards ? (
        <ActivityIndicator color={Colors.gold} style={{ marginVertical: 32 }} />
      ) : (
        <FlatList
          horizontal
          data={featured}
          keyExtractor={c => c._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cardItem}
              onPress={() => router.push(`/card/${item._id}`)}
            >
              <Image
                source={{ uri: item.images.small }}
                style={styles.cardImage}
                resizeMode="contain"
              />
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.cardSet} numberOfLines={1}>{item.set.name}</Text>
              <Text style={styles.cardPrice}>{priceBRL(item, rate)}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add CTA */}
      <TouchableOpacity style={styles.addBanner}>
        <View style={styles.addIcon}>
          <Ionicons name="add" size={20} color={Colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.addTitle}>Adicionar carta</Text>
          <Text style={styles.addSub}>Busque por nome ou scan pela câmera</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.ash} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.void },
  content:     { paddingBottom: 32 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  greeting:    { fontSize: 24, fontWeight: '700', color: Colors.snow },
  subtitle:    { fontSize: 14, color: Colors.ash, marginTop: 2 },
  bell:        { backgroundColor: Colors.surface, borderRadius: 10, padding: 8 },
  marketRow:   { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  marketCard:  { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  marketValue: { fontSize: 15, fontWeight: '700' },
  marketLabel: { fontSize: 11, color: Colors.ash },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle:  { fontSize: 18, fontWeight: '700', color: Colors.snow },
  seeAll:        { fontSize: 14, color: Colors.gold },
  cardItem:   { width: 140, backgroundColor: Colors.surface, borderRadius: 12, overflow: 'hidden', padding: 10 },
  cardImage:  { width: '100%', height: 110, borderRadius: 6, marginBottom: 8 },
  cardName:   { fontSize: 13, fontWeight: '600', color: Colors.snow },
  cardSet:    { fontSize: 11, color: Colors.ash, marginTop: 2 },
  cardPrice:  { fontSize: 12, color: Colors.mint, marginTop: 4 },
  addBanner:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 20, marginTop: 24, borderRadius: 14, padding: 16, gap: 12 },
  addIcon:    { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  addTitle:   { fontSize: 15, fontWeight: '600', color: Colors.snow },
  addSub:     { fontSize: 12, color: Colors.ash, marginTop: 2 },
});
