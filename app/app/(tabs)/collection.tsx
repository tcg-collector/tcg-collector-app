import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, Alert,
  Modal, TextInput, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Colors } from '../../constants/colors';
import { useBinders } from '../../hooks/useBinders';
import { useCollection } from '../../hooks/useCollection';
import { cardsService } from '../../services/cards';
import { setsService } from '../../services/sets';
import type { Card } from '../../services/cards';
import type { SetSummary } from '../../services/sets';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { useCollectionMarket } from '../../hooks/useCollectionMarket';
import { GRID_CONFIGS } from '../../services/binders';
import { SearchBar } from '../../components/SearchBar';
import { ConditionChips } from '../../components/ConditionChips';
import { SortPicker } from '../../components/SortPicker';
import { BinderListItem } from '../../components/BinderListItem';
import { MarketCardItem } from '../../components/MarketCardItem';

type ConditionFilter = 'ALL' | 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
type SortMode = 'ADDED_DESC' | 'VALUE_DESC' | 'VALUE_ASC' | 'NAME_ASC';
type BinderLayout = 'grid' | 'list';

const SORT_OPTIONS: { label: string; value: SortMode }[] = [
  { label: 'Recente', value: 'ADDED_DESC' },
  { label: 'Valor ↓', value: 'VALUE_DESC' },
  { label: 'Valor ↑', value: 'VALUE_ASC' },
  { label: 'Nome A-Z', value: 'NAME_ASC' },
];

const COND_MULT: Record<string, number> = { NM: 1, LP: 0.8, MP: 0.6, HP: 0.4, DMG: 0.2 };

function formatBRL(value: number): string {
  const fixed = value.toFixed(2);
  const [i, d] = fixed.split('.');
  return `R$ ${i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${d}`;
}

function cardMarketPrice(card: any): number {
  return card?.prices?.holofoil?.market ?? card?.prices?.normal?.market ?? 0;
}

export default function CollectionScreen() {
  const router = useRouter();
  const { binders, loading: loadingBinders, deleteBinder, refetch } = useBinders();

  useFocusEffect(useCallback(() => { refetch(); }, []));

  const { addCard, refetch: refetchCollection, items, loading: loadingLoose, totalCards, totalValueUSD } = useCollection();

  // Filtros avulso
  const [looseSearch, setLooseSearch] = useState('');
  const [looseCondition, setLooseCondition] = useState<ConditionFilter>('ALL');
  const [looseSort, setLooseSort] = useState<SortMode>('ADDED_DESC');

  // Filtros / layout binders
  const [binderSearch, setBinderSearch] = useState('');
  const [bindersExpanded, setBindersExpanded] = useState(false);
  const [binderLayout, setBinderLayout] = useState<BinderLayout>('list');

  // Modal: adicionar carta avulsa
  const [showAddLoose, setShowAddLoose] = useState(false);
  const [looseQuery, setLooseQuery] = useState('');
  const [looseResults, setLooseResults] = useState<Card[]>([]);
  const [looseSearching, setLooseSearching] = useState(false);
  const [looseSelectedSet, setLooseSelectedSet] = useState<SetSummary | null>(null);
  const [looseSets, setLooseSets] = useState<SetSummary[]>([]);
  const [looseShowSetPicker, setLooseShowSetPicker] = useState(false);
  const [looseSetSearch, setLooseSetSearch] = useState('');
  const [looseAdding, setLooseAdding] = useState(false);

  const openAddLoose = async () => {
    setShowAddLoose(true);
    setLooseQuery('');
    setLooseResults([]);
    setLooseSelectedSet(null);
    if (looseSets.length === 0) {
      try { const r = await setsService.list(); setLooseSets(r.data); } catch {}
    }
  };

  const handleLooseSearch = async () => {
    if (!looseQuery.trim() && !looseSelectedSet) return;
    setLooseSearching(true);
    try {
      const res = await cardsService.list({ name: looseQuery.trim() || undefined, setId: looseSelectedSet?._id, limit: 250 });
      setLooseResults(res.data);
    } finally { setLooseSearching(false); }
  };

  const handleAddLoose = async (card: Card) => {
    setLooseAdding(true);
    try {
      await addCard(card._id, 'NM', 1);
      refetchCollection();
      setShowAddLoose(false);
    } catch {
      if (typeof window !== 'undefined') window.alert('Erro ao adicionar carta');
    } finally { setLooseAdding(false); }
  };

  const { rate } = useExchangeRate();

  // Itens filtrados e ordenados (avulso)
  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const card = typeof item.cardId === 'object' ? item.cardId : null;
      const matchName = !looseSearch.trim() || card?.name?.toLowerCase().includes(looseSearch.toLowerCase());
      const matchCond = looseCondition === 'ALL' || item.condition === looseCondition;
      return matchName && matchCond;
    });

    result = [...result].sort((a, b) => {
      const cardA = typeof a.cardId === 'object' ? a.cardId : null;
      const cardB = typeof b.cardId === 'object' ? b.cardId : null;
      if (looseSort === 'VALUE_DESC') {
        return (cardMarketPrice(cardB) * (COND_MULT[b.condition] ?? 1)) - (cardMarketPrice(cardA) * (COND_MULT[a.condition] ?? 1));
      }
      if (looseSort === 'VALUE_ASC') {
        return (cardMarketPrice(cardA) * (COND_MULT[a.condition] ?? 1)) - (cardMarketPrice(cardB) * (COND_MULT[b.condition] ?? 1));
      }
      if (looseSort === 'NAME_ASC') {
        return (cardA?.name ?? '').localeCompare(cardB?.name ?? '');
      }
      // ADDED_DESC: manter ordem original (backend já retorna addedAt: -1)
      return 0;
    });

    return result;
  }, [items, looseSearch, looseCondition, looseSort]);

  // Binders filtrados
  const filteredBinders = useMemo(() => {
    if (!binderSearch.trim()) return binders;
    return binders.filter(b => b.name.toLowerCase().includes(binderSearch.toLowerCase()));
  }, [binders, binderSearch]);

  const visibleBinders = bindersExpanded ? filteredBinders : filteredBinders.slice(0, 3);
  const hasMoreBinders = filteredBinders.length > 3;

  // Totais combinados: avulso + binders (sempre total real, sem filtro)
  const binderCardsTotal = binders.reduce((sum, b) =>
    sum + b.slots.filter(s => s.cardId).length, 0);
  const binderValueUSD = binders.reduce((sum, b) =>
    sum + b.slots.reduce((s2, slot) => {
      if (!slot.cardId || !slot.card) return s2;
      const c = slot.card as any;
      const base = c.prices?.holofoil?.market ?? c.prices?.normal?.market ?? 0;
      return s2 + (base ?? 0) * (COND_MULT[slot.condition] ?? 1);
    }, 0), 0);
  const totalAllCards = totalCards + binderCardsTotal;
  const totalAllValueUSD = totalValueUSD + binderValueUSD;
  const totalBRL = rate ? totalAllValueUSD * rate : 0;

  const { summary, gainers, topValue, rate: marketRate, loading: loadingMarket } = useCollectionMarket({ skip: totalAllCards === 0 });
  const displayRate = rate ?? marketRate;

  const handleDeleteBinder = (id: string, name: string) => {
    Alert.alert('Excluir binder', `Excluir "${name}"? As cartas não serão deletadas.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteBinder(id) },
    ]);
  };

  return (
    <View style={styles.container}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      {/* Resumo geral + delta */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatBRL(totalBRL)}</Text>
            <Text style={styles.summaryLabel}>Valor total</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalAllCards}</Text>
            <Text style={styles.summaryLabel}>Cartas</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{binders.length}</Text>
            <Text style={styles.summaryLabel}>Binders</Text>
          </View>
        </View>
        {summary && summary.deltaUSD !== 0 && displayRate && (
          <View style={styles.deltaRow}>
            <View style={[styles.deltaBadge, { backgroundColor: summary.deltaUSD > 0 ? Colors.mint + '22' : Colors.crimson + '22' }]}>
              <Text style={[styles.deltaPct, { color: summary.deltaUSD > 0 ? Colors.mint : Colors.crimson }]}>
                {summary.deltaPct > 0 ? '+' : ''}{summary.deltaPct.toFixed(1)}%
              </Text>
            </View>
            <Text style={[styles.deltaAbs, { color: summary.deltaUSD > 0 ? Colors.mint : Colors.crimson }]}>
              {summary.deltaUSD > 0 ? '+' : ''}{formatBRL(summary.deltaUSD * displayRate)}
            </Text>
            <Text style={styles.deltaPeriod}>últimos 7 dias</Text>
          </View>
        )}
      </View>

      {/* Carrosséis de inteligência — visíveis quando há cartas */}
      {totalAllCards > 0 && !loadingMarket && (
        <>
          {gainers.length > 0 && (
            <>
              <View style={styles.marketSectionHeader}>
                <Text style={styles.marketSectionTitle}>Mais valorizadas</Text>
                <Text style={styles.marketSectionHint}>sua coleção · 7d</Text>
              </View>
              <FlatList
                horizontal
                data={gainers}
                keyExtractor={item => item.card._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.marketCarousel}
                renderItem={({ item }) => (
                  <MarketCardItem
                    card={item.card}
                    priceBRL={displayRate ? formatBRL(item.marketNow * displayRate) : '—'}
                    badge={`+${item.deltaPct.toFixed(0)}%`}
                    onPress={() => router.push(`/card/${item.card._id}`)}
                  />
                )}
              />
            </>
          )}

          {topValue.length > 0 && (
            <>
              <View style={styles.marketSectionHeader}>
                <Text style={styles.marketSectionTitle}>Mais valiosas</Text>
                <Text style={styles.marketSectionHint}>sua coleção</Text>
              </View>
              <FlatList
                horizontal
                data={topValue}
                keyExtractor={item => item.card._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.marketCarousel}
                renderItem={({ item }) => (
                  <MarketCardItem
                    card={item.card}
                    priceBRL={displayRate ? formatBRL(item.market * displayRate) : '—'}
                    onPress={() => router.push(`/card/${item.card._id}`)}
                  />
                )}
              />
            </>
          )}
        </>
      )}

      {/* Seção Binders */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Meus binders</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Toggle grid/lista */}
          {binders.length > 0 && (
            <TouchableOpacity
              style={styles.layoutToggle}
              onPress={() => setBinderLayout(l => l === 'grid' ? 'list' : 'grid')}
            >
              <Ionicons
                name={binderLayout === 'grid' ? 'list-outline' : 'grid-outline'}
                size={18}
                color={Colors.ash}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/binder/create')}
          >
            <Ionicons name="add" size={18} color={Colors.void} />
            <Text style={styles.addBtnText}>Novo</Text>
          </TouchableOpacity>
        </View>
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
        <>
          {/* Busca de binder */}
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <SearchBar
              value={binderSearch}
              onChangeText={setBinderSearch}
              placeholder="Buscar binder..."
            />
          </View>

          {filteredBinders.length === 0 ? (
            <View style={styles.emptyLoose}>
              <Text style={styles.emptyText}>Nenhum binder encontrado</Text>
            </View>
          ) : binderLayout === 'list' ? (
            <View style={{ paddingHorizontal: 16 }}>
              {visibleBinders.map(b => (
                <BinderListItem
                  key={b._id}
                  binder={b}
                  rate={rate}
                  onPress={() => router.push(`/binder/${b._id}`)}
                  onLongPress={() => handleDeleteBinder(b._id, b.name)}
                />
              ))}
              {hasMoreBinders && (
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() => setBindersExpanded(e => !e)}
                >
                  <Text style={styles.expandBtnText}>
                    {bindersExpanded
                      ? 'Mostrar menos'
                      : `Ver todos (${filteredBinders.length})`}
                  </Text>
                  <Ionicons
                    name={bindersExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={Colors.gold}
                  />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bindersRow}>
                {visibleBinders.map(b => {
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
              {hasMoreBinders && (
                <TouchableOpacity
                  style={[styles.expandBtn, { marginHorizontal: 16 }]}
                  onPress={() => setBindersExpanded(e => !e)}
                >
                  <Text style={styles.expandBtnText}>
                    {bindersExpanded
                      ? 'Mostrar menos'
                      : `Ver todos (${filteredBinders.length})`}
                  </Text>
                  <Ionicons
                    name={bindersExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={Colors.gold}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </>
      )}

      {/* Seção Avulso */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Avulso</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={styles.sectionCount}>
            {filteredItems.length !== items.length
              ? `${filteredItems.length} de ${items.length}`
              : `${items.length}`} cartas
          </Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddLoose}>
            <Ionicons name="add" size={18} color={Colors.void} />
            <Text style={styles.addBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros avulso */}
      {items.length > 0 && (
        <View style={styles.filtersContainer}>
          <SearchBar
            value={looseSearch}
            onChangeText={setLooseSearch}
            placeholder="Buscar carta..."
          />
          <ConditionChips selected={looseCondition} onSelect={setLooseCondition} />
          <SortPicker options={SORT_OPTIONS} selected={looseSort} onSelect={setLooseSort} />
        </View>
      )}

      {loadingLoose ? (
        <ActivityIndicator color={Colors.gold} style={{ marginVertical: 20 }} />
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyLoose}>
          <Text style={styles.emptyText}>
            {items.length === 0 ? 'Nenhuma carta avulsa' : 'Nenhuma carta encontrada'}
          </Text>
        </View>
      ) : (
        <View style={styles.looseGrid}>
          {filteredItems.map(item => {
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

      {/* Modal: Adicionar carta avulsa */}
      <Modal visible={showAddLoose} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddLoose(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adicionar carta avulsa</Text>
            <TouchableOpacity onPress={() => setShowAddLoose(false)}>
              <Ionicons name="close" size={22} color={Colors.ash} />
            </TouchableOpacity>
          </View>

          {/* Filtro por edição */}
          <TouchableOpacity style={styles.setFilterRow} onPress={() => { setLooseSetSearch(''); setLooseShowSetPicker(true); }}>
            <Ionicons name="layers-outline" size={16} color={looseSelectedSet ? Colors.gold : Colors.ash} />
            <Text style={[styles.setFilterTxt, looseSelectedSet && styles.setFilterTxtActive]} numberOfLines={1}>
              {looseSelectedSet ? looseSelectedSet.name : 'Buscar por edição (opcional)'}
            </Text>
            {looseSelectedSet
              ? <TouchableOpacity onPress={() => { setLooseSelectedSet(null); setLooseResults([]); }}>
                  <Ionicons name="close-circle" size={16} color={Colors.ash} />
                </TouchableOpacity>
              : <Ionicons name="chevron-down" size={14} color={Colors.ash} />
            }
          </TouchableOpacity>

          {/* Campo de busca */}
          <View style={{ paddingHorizontal: 12 }}>
            <TextInput
              style={styles.searchInput}
              placeholder="Nome da carta em inglês (opcional)..."
              placeholderTextColor={Colors.ash}
              value={looseQuery}
              onChangeText={setLooseQuery}
              onSubmitEditing={handleLooseSearch}
              returnKeyType="search"
            />
          </View>

          {/* Botão buscar */}
          <TouchableOpacity
            style={[styles.searchCTABtn, (!looseQuery.trim() && !looseSelectedSet) && styles.searchCTABtnDisabled]}
            onPress={handleLooseSearch}
            disabled={looseSearching || (!looseQuery.trim() && !looseSelectedSet)}
          >
            {looseSearching
              ? <ActivityIndicator color={Colors.void} size="small" />
              : <><Ionicons name="search" size={18} color={Colors.void} /><Text style={styles.searchCTATxt}>Buscar</Text></>
            }
          </TouchableOpacity>

          {/* Resultados */}
          <FlatList
            data={looseResults}
            keyExtractor={c => c._id}
            contentContainerStyle={{ padding: 12, gap: 10 }}
            renderItem={({ item }) => {
              const nmPrice = item.prices?.normal?.market ?? item.prices?.holofoil?.market;
              const priceBRL = nmPrice && rate ? formatBRL(nmPrice * rate) : null;
              return (
                <TouchableOpacity style={styles.resultRow} onPress={() => handleAddLoose(item)} disabled={looseAdding}>
                  <Image source={{ uri: item.images.small }} style={styles.resultImg} resizeMode="contain" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultSet}>{item.set.name} · #{item.number}</Text>
                    <Text style={styles.resultRarity}>{item.rarity}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    {priceBRL
                      ? <><Text style={styles.resultPrice}>{priceBRL}</Text><Text style={styles.resultPriceLabel}>NM</Text></>
                      : <Ionicons name="add-circle" size={24} color={Colors.gold} />
                    }
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Modal: Set picker */}
          <Modal visible={looseShowSetPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setLooseShowSetPicker(false)}>
            <View style={styles.modal}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Escolher edição</Text>
                <TouchableOpacity onPress={() => setLooseShowSetPicker(false)}>
                  <Ionicons name="close" size={22} color={Colors.ash} />
                </TouchableOpacity>
              </View>
              <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
                <TextInput style={styles.searchInput} placeholder="Buscar edição..." placeholderTextColor={Colors.ash} value={looseSetSearch} onChangeText={setLooseSetSearch} autoFocus />
              </View>
              <FlatList
                data={looseSets.filter(s => !looseSetSearch.trim() || s.name.toLowerCase().includes(looseSetSearch.toLowerCase()) || s.series.toLowerCase().includes(looseSetSearch.toLowerCase()))}
                keyExtractor={s => s._id}
                contentContainerStyle={{ padding: 12, gap: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resultRow} onPress={() => { setLooseSelectedSet(item); setLooseShowSetPicker(false); setLooseResults([]); }}>
                    {item.images?.symbol ? <Image source={{ uri: item.images.symbol }} style={{ width: 28, height: 28 }} resizeMode="contain" /> : <Ionicons name="layers-outline" size={24} color={Colors.ash} />}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{item.name}</Text>
                      <Text style={styles.resultSet}>{item.series} · {item.cardCount} cartas</Text>
                    </View>
                    {looseSelectedSet?._id === item._id && <Ionicons name="checkmark-circle" size={18} color={Colors.gold} />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </Modal>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modal:              { flex: 1, backgroundColor: Colors.void },
  modalHandle:        { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  modalTitle:         { fontSize: 16, fontWeight: '700', color: Colors.snow },
  setFilterRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginBottom: 4, backgroundColor: Colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border },
  setFilterTxt:       { flex: 1, fontSize: 14, color: Colors.ash },
  setFilterTxtActive: { color: Colors.gold, fontWeight: '600' },
  searchInput:        { backgroundColor: Colors.surface, borderRadius: 10, padding: 12, color: Colors.snow, fontSize: 14, marginBottom: 8 },
  searchCTABtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.gold, borderRadius: 12, padding: 14, marginHorizontal: 12, marginBottom: 4 },
  searchCTABtnDisabled: { opacity: 0.4 },
  searchCTATxt:       { fontSize: 15, fontWeight: '700', color: Colors.void },
  resultRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 10, padding: 10, gap: 12 },
  resultImg:          { width: 44, height: 61, borderRadius: 4 },
  resultName:         { fontSize: 14, fontWeight: '600', color: Colors.snow },
  resultSet:          { fontSize: 12, color: Colors.ash, marginTop: 2 },
  resultRarity:       { fontSize: 11, color: Colors.gold, marginTop: 2 },
  resultPrice:        { fontSize: 13, fontWeight: '700', color: Colors.snow },
  resultPriceLabel:   { fontSize: 10, color: Colors.ash },
  container:          { flex: 1, backgroundColor: Colors.void },
  content:            { paddingBottom: 40 },
  summary:            { backgroundColor: Colors.surface, marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  summaryRow:         { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem:        { alignItems: 'center', flex: 1 },
  summaryValue:       { fontSize: 16, fontWeight: '700', color: Colors.snow },
  summaryLabel:       { fontSize: 11, color: Colors.ash, marginTop: 2 },
  divider:            { width: 1, backgroundColor: Colors.border },
  deltaRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  deltaBadge:         { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  deltaPct:           { fontSize: 12, fontWeight: '700' },
  deltaAbs:           { fontSize: 12, fontWeight: '600' },
  deltaPeriod:        { fontSize: 11, color: Colors.ash },
  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  sectionTitle:       { fontSize: 17, fontWeight: '700', color: Colors.snow },
  sectionCount:       { fontSize: 13, color: Colors.ash },
  addBtn:             { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gold, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
  addBtnText:         { fontSize: 13, fontWeight: '700', color: Colors.void },
  layoutToggle:       { padding: 6, backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  filtersContainer:   { paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  bindersRow:         { paddingHorizontal: 16, gap: 12 },
  binderCard:         { width: 140 },
  binderCover:        { width: 140, height: 180, borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  binderCoverEmpty:   { backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  gridPreview:        { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 10, width: '100%' },
  gridCell:           { aspectRatio: 0.72, borderRadius: 3 },
  gridCellFilled:     { backgroundColor: Colors.gold + '66' },
  gridCellEmpty:      { backgroundColor: Colors.border + '88' },
  binderInfo:         { gap: 2 },
  binderName:         { fontSize: 13, fontWeight: '600', color: Colors.snow },
  binderMeta:         { fontSize: 11, color: Colors.ash },
  expandBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  expandBtnText:      { fontSize: 13, fontWeight: '600', color: Colors.gold },
  emptyBinder:        { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 14, padding: 32, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyLoose:         { marginHorizontal: 16, padding: 24, alignItems: 'center' },
  emptyText:          { fontSize: 14, color: Colors.ash },
  emptyHint:          { fontSize: 12, color: Colors.border, textAlign: 'center' },
  looseGrid:          { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  looseCard:          { width: '30%', backgroundColor: Colors.surface, borderRadius: 10, padding: 8, alignItems: 'center' },
  looseCardImg:       { width: '100%', aspectRatio: 0.72, borderRadius: 6, marginBottom: 6 },
  looseCardImgEmpty:  { backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  looseCardName:      { fontSize: 11, color: Colors.snow, textAlign: 'center' },
  condBadge:          { backgroundColor: Colors.surface2, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  condText:           { fontSize: 10, fontWeight: '700', color: Colors.ash },
  marketSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  marketSectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.snow },
  marketSectionHint:  { fontSize: 12, color: Colors.ash },
  marketCarousel:     { paddingHorizontal: 16, gap: 12 },
});
