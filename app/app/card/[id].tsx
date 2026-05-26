import {
  View, Text, ScrollView, Image,
  TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Colors } from '../../constants/colors';
import { useCard } from '../../hooks/useCards';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { useCollection } from '../../hooks/useCollection';
import type { CollectionItem } from '../../services/collection';


function formatBRL(value: number): string {
  const fixed = value.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${intFormatted},${decPart}`;
}


function PriceRow({ label, price, rate }: { label: string; price: number | null | undefined; rate: number | null }) {
  if (!price) return null;
  const brl = rate ? formatBRL(price * rate) : '—';
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceUSD}>${price.toFixed(2)}</Text>
      <Text style={styles.priceBRL}>R$ {brl}</Text>
    </View>
  );
}

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { card, loading } = useCard(id);
  const { rate } = useExchangeRate();
  const { addCard } = useCollection();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    if (!card) return;
    setAdding(true);
    try {
      await addCard(card._id, 'NM');
      setAdded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Carta não encontrada</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: Colors.gold }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasHolo    = !!card.prices?.holofoil;
  const hasNormal  = !!card.prices?.normal;
  const hasReverse = !!card.prices?.reverseHolofoil;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Card image */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: card.images.large }} style={styles.cardImage} resizeMode="contain" />
      </View>

      {/* Name + set */}
      <View style={styles.nameSection}>
        <Text style={styles.cardName}>{card.name}</Text>
        <Text style={styles.cardMeta}>
          {card.set.name} · #{card.number} · {card.rarity}
        </Text>
        {card.types?.length > 0 && (
          <View style={styles.typesRow}>
            {card.types.map(t => (
              <View key={t} style={styles.typeBadge}>
                <Text style={styles.typeText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Prices */}
      {(hasHolo || hasNormal || hasReverse) && (
        <View style={styles.priceSection}>
          <Text style={styles.sectionTitle}>Preços (TCGPlayer)</Text>
          <View style={styles.priceTable}>
            <View style={styles.priceHeader}>
              <Text style={styles.priceHeaderTxt}>Variante</Text>
              <Text style={styles.priceHeaderTxt}>USD</Text>
              <Text style={styles.priceHeaderTxt}>BRL</Text>
            </View>
            {hasHolo && <>
              <PriceRow label="Holofoil Low"    price={card.prices.holofoil?.low}    rate={rate} />
              <PriceRow label="Holofoil Market" price={card.prices.holofoil?.market} rate={rate} />
              <PriceRow label="Holofoil High"   price={card.prices.holofoil?.high}   rate={rate} />
            </>}
            {hasNormal && <>
              <PriceRow label="Normal Low"    price={card.prices.normal?.low}    rate={rate} />
              <PriceRow label="Normal Market" price={card.prices.normal?.market} rate={rate} />
              <PriceRow label="Normal High"   price={card.prices.normal?.high}   rate={rate} />
            </>}
            {hasReverse && <>
              <PriceRow label="Reverse Low"    price={card.prices.reverseHolofoil?.low}    rate={rate} />
              <PriceRow label="Reverse Market" price={card.prices.reverseHolofoil?.market} rate={rate} />
            </>}
          </View>
        </View>
      )}

      {/* Artist */}
      {card.artist && (
        <Text style={styles.artist}>Ilustrador: {card.artist}</Text>
      )}

      {/* Add button */}
      <TouchableOpacity
        style={[styles.addBtn, added && styles.addBtnDone]}
        onPress={handleAdd}
        disabled={adding || added}
      >
        {adding ? (
          <ActivityIndicator color={Colors.void} size="small" />
        ) : (
          <>
            <Ionicons name={added ? 'checkmark' : 'add'} size={20} color={Colors.void} />
            <Text style={styles.addBtnText}>
              {added ? 'Adicionada à coleção!' : 'Adicionar à coleção'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.void },
  content:      { paddingBottom: 40 },
  center:       { flex: 1, backgroundColor: Colors.void, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText:    { color: Colors.ash, fontSize: 16 },
  backBtn:      { padding: 12 },
  imageWrap:    { alignItems: 'center', paddingVertical: 24, backgroundColor: Colors.surface2 },
  cardImage:    { width: 240, height: 335 },
  nameSection:  { paddingHorizontal: 20, paddingTop: 20 },
  cardName:     { fontSize: 24, fontWeight: '700', color: Colors.snow },
  cardMeta:     { fontSize: 13, color: Colors.ash, marginTop: 4 },
  typesRow:     { flexDirection: 'row', gap: 8, marginTop: 8 },
  typeBadge:    { backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeText:     { fontSize: 12, color: Colors.snow },
  priceSection: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.snow, marginBottom: 12 },
  priceTable:   { backgroundColor: Colors.surface, borderRadius: 12, overflow: 'hidden' },
  priceHeader:  { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  priceHeaderTxt: { fontSize: 12, fontWeight: '600', color: Colors.ash, flex: 1 },
  priceRow:     { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  priceLabel:   { fontSize: 13, color: Colors.snow, flex: 1 },
  priceUSD:     { fontSize: 13, color: Colors.sky, flex: 1, textAlign: 'right' },
  priceBRL:     { fontSize: 13, color: Colors.gold, flex: 1, textAlign: 'right' },
  artist:       { paddingHorizontal: 20, marginTop: 16, fontSize: 12, color: Colors.ash },
  addBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gold, marginHorizontal: 20, marginTop: 24, borderRadius: 14, padding: 16, gap: 8 },
  addBtnDone:   { backgroundColor: Colors.mint },
  addBtnText:   { fontSize: 16, fontWeight: '700', color: Colors.void },
});
