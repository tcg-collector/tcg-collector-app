import {
  View, Text, ScrollView,
  FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useMarketData } from '../../hooks/useMarketData';
import { MarketCardItem } from '../../components/MarketCardItem';

function formatBRL(usd: number, rate: number | null): string {
  if (!rate) return '—';
  const value = usd * rate;
  const fixed = value.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${intFormatted},${decPart}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { gainers, topValue, rate, loading } = useMarketData();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Seja bem-vindo 👋</Text>
        <Text style={styles.subtitle}>Seu binder digital</Text>
      </View>

      {/* Carrossel — Maiores Valorizações */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Maiores Valorizações</Text>
        <Text style={styles.sectionHint}>últimos 7 dias</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.gold} style={styles.loader} />
      ) : gainers.length === 0 ? (
        <Text style={styles.empty}>Histórico acumulando — disponível em alguns dias</Text>
      ) : (
        <FlatList
          horizontal
          data={gainers}
          keyExtractor={item => item.card._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
          renderItem={({ item }) => (
            <MarketCardItem
              card={item.card}
              priceBRL={formatBRL(item.marketNow, rate)}
              badge={`+${item.deltaPct.toFixed(0)}%`}
              onPress={() => router.push(`/card/${item.card._id}`)}
            />
          )}
        />
      )}

      {/* Carrossel — Mais Valiosas */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>Mais Valiosas</Text>
        <Text style={styles.sectionHint}>catálogo global</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.gold} style={styles.loader} />
      ) : topValue.length === 0 ? (
        <Text style={styles.empty}>Carregando dados de mercado...</Text>
      ) : (
        <FlatList
          horizontal
          data={topValue}
          keyExtractor={item => item.card._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
          renderItem={({ item }) => (
            <MarketCardItem
              card={item.card}
              priceBRL={formatBRL(item.market, rate)}
              onPress={() => router.push(`/card/${item.card._id}`)}
            />
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.void },
  content:       { paddingBottom: 32 },
  header:        { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  greeting:      { fontSize: 24, fontWeight: '700', color: Colors.snow },
  subtitle:      { fontSize: 14, color: Colors.ash, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle:  { fontSize: 18, fontWeight: '700', color: Colors.snow },
  sectionHint:   { fontSize: 12, color: Colors.ash },
  carousel:      { paddingHorizontal: 20, gap: 12 },
  loader:        { marginVertical: 32 },
  empty:         { paddingHorizontal: 20, color: Colors.ash, fontSize: 13, marginBottom: 16 },
});
