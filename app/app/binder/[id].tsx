import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert, Modal,
  FlatList, TextInput, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import { Colors } from '../../constants/colors';
import { useBinder } from '../../hooks/useBinders';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { cardsService } from '../../services/cards';
import { scanService, CardCondition, GRID_CONFIGS } from '../../services/binders';
import type { Card } from '../../services/cards';

// Camera só importa no mobile — evita crash no web
let CameraView: any = null;
let useCameraPermissions: any = () => [{ granted: false }, () => Promise.resolve()];
if (Platform.OS !== 'web') {
  const Camera = require('expo-camera');
  CameraView = Camera.CameraView;
  useCameraPermissions = Camera.useCameraPermissions;
}

function formatBRL(v: number) {
  const [i, d] = v.toFixed(2).split('.');
  return `R$ ${i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${d}`;
}

// Alert web-safe
function showAlert(
  title: string,
  message: string,
  buttons?: Array<{ text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }>
) {
  if (Platform.OS === 'web') {
    if (buttons?.some(b => b.style === 'destructive')) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) buttons?.find(b => b.style === 'destructive')?.onPress?.();
    } else {
      window.alert(`${title}\n\n${message}`);
    }
    return;
  }
  Alert.alert(title, message, buttons);
}

// Multiplicadores de preço por condição (padrão de mercado TCG)
const CONDITION_MULTIPLIERS: Record<CardCondition, number> = {
  NM:  1.00,
  LP:  0.80,
  MP:  0.60,
  HP:  0.40,
  DMG: 0.20,
};

// Rótulos descritivos por condição
const CONDITION_LABELS: Record<CardCondition, string> = {
  NM:  'Near Mint',
  LP:  'Lightly Played',
  MP:  'Moderately Played',
  HP:  'Heavily Played',
  DMG: 'Damaged',
};

function getBasePrice(card: Card): number | null {
  return card.prices?.holofoil?.market ?? card.prices?.normal?.market ?? null;
}

function priceForCondition(card: Card, condition: CardCondition, rate: number | null): string | null {
  if (!rate) return null;
  const base = getBasePrice(card);
  if (!base) return null;
  return formatBRL(base * CONDITION_MULTIPLIERS[condition] * rate);
}

type AddMode = 'search' | 'scan';

export default function BinderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { binder, loading, setSlot } = useBinder(id);
  const { rate } = useExchangeRate();

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [addMode, setAddMode] = useState<AddMode>('search');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [searching, setSearching] = useState(false);

  const [pendingCard, setPendingCard] = useState<Card | null>(null);
  const [pendingCondition, setPendingCondition] = useState<CardCondition>('NM');
  const [adding, setAdding] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    name: string; set: string; condition: string; conditionReason: string; confidence: number;
  } | null>(null);
  const [scanCandidates, setScanCandidates] = useState<Card[]>([]);
  const [editedCondition, setEditedCondition] = useState<CardCondition>('NM');

  // Mobile camera
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.gold} size="large" /></View>;
  if (!binder) return <View style={styles.center}><Text style={{ color: Colors.ash }}>Binder não encontrado</Text></View>;

  const cfg = GRID_CONFIGS.find(g => g.value === binder.gridConfig) ?? GRID_CONFIGS[1];
  const totalValue = binder.slots.reduce((sum, s) => {
    if (!s.card || !rate) return sum;
    const base = getBasePrice(s.card as unknown as Card);
    const mult = CONDITION_MULTIPLIERS[s.condition as CardCondition] ?? 1;
    return sum + (base ?? 0) * mult * s.quantity * rate;
  }, 0);

  const openAddModal = (pos: number) => {
    setSelectedSlot(pos);
    setAddMode('search');
    setSearchQuery('');
    setSearchResults([]);
    setPendingCard(null);
    setScanResult(null);
    setScanCandidates([]);
  };

  const closeModal = () => {
    setSelectedSlot(null);
    setPendingCard(null);
    setScanResult(null);
    setScanCandidates([]);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setPendingCard(null);
    try {
      const res = await cardsService.list({ name: searchQuery, limit: 20 });
      setSearchResults(res.data);
    } finally {
      setSearching(false);
    }
  };

  const handlePickCard = (card: Card) => {
    setPendingCard(card);
    setPendingCondition('NM');
  };

  const handleConfirmAdd = async (card: Card, condition: CardCondition) => {
    if (selectedSlot === null) return;
    setAdding(true);
    try {
      await setSlot(selectedSlot, { cardId: card._id, condition });
      closeModal();
    } catch (e) {
      showAlert('Erro', e instanceof Error ? e.message : 'Não foi possível adicionar a carta');
    } finally {
      setAdding(false);
    }
  };

  // Scan mobile (câmera)
  const handleScan = async () => {
    if (!cameraRef.current) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      if (!photo?.base64) return;
      await processScanResult(`data:image/jpeg;base64,${photo.base64}`);
    } catch (e) {
      showAlert('Erro no scan', e instanceof Error ? e.message : 'Falha ao identificar carta');
    } finally {
      setScanning(false);
    }
  };

  // Scan web (upload de arquivo)
  const handleWebScan = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        if (!base64) return;
        setScanning(true);
        try {
          await processScanResult(base64);
        } catch (err) {
          window.alert('Erro no scan: ' + (err instanceof Error ? err.message : 'Falha ao identificar carta'));
        } finally {
          setScanning(false);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Processa resultado do scan (compartilhado mobile + web)
  const processScanResult = async (imageBase64: string) => {
    const res = await scanService.scan(imageBase64);
    const identified = res.data.identified as any;
    setScanResult(identified);
    setEditedCondition((identified.condition as CardCondition) ?? 'NM');
    setScanCandidates(res.data.candidates as unknown as Card[]);
  };

  // Componente: seletor de condição com preços por grade
  const ConditionPicker = ({
    card, selected, onSelect, hint,
  }: {
    card: Card; selected: CardCondition; onSelect: (c: CardCondition) => void; hint?: string;
  }) => {
    const hasPrice = getBasePrice(card) !== null;
    return (
      <View style={{ gap: 8 }}>
        <Text style={styles.condLabel}>Condição</Text>
        {hint ? <Text style={styles.condPickerHint}>{hint}</Text> : null}
        {(['NM', 'LP', 'MP', 'HP', 'DMG'] as CardCondition[]).map(c => {
          const price = priceForCondition(card, c, rate);
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
              {hasPrice ? (
                <Text style={[styles.condPrice, isSelected && styles.condPriceActive]}>{price}</Text>
              ) : (
                <Text style={styles.condNoPrice}>s/ preço</Text>
              )}
            </TouchableOpacity>
          );
        })}
        {!hasPrice && (
          <Text style={styles.noPriceNote}>Esta carta não tem dados de preço no TCGPlayer</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.snow} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.binderName}>{binder.name}</Text>
          <Text style={styles.binderMeta}>{cfg.label} · {formatBRL(totalValue)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.gridContainer}>
        <View style={[styles.grid, { gap: 8 }]}>
          {binder.slots.map((slot, idx) => {
            const card = slot.card as unknown as Card | null;
            const base = card ? getBasePrice(card) : null;
            const mult = CONDITION_MULTIPLIERS[slot.condition as CardCondition] ?? 1;
            const priceBRL = base && rate ? formatBRL(base * mult * rate) : null;
            const pos = slot.position ?? idx;
            return (
              <TouchableOpacity
                key={`slot-${pos}`}
                style={[styles.slot, { width: `${100 / cfg.cols - 2}%` as any }]}
                onPress={() => openAddModal(pos)}
                onLongPress={() => {
                  if (slot.cardId) {
                    showAlert('Remover carta', `Remover "${card?.name ?? 'carta'}" deste slot?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Remover', style: 'destructive', onPress: () => setSlot(pos, { cardId: null }) },
                    ]);
                  }
                }}
              >
                {card?.images?.small ? (
                  <>
                    <Image source={{ uri: card.images.small }} style={styles.slotImg} resizeMode="contain" />
                    {priceBRL && <Text style={styles.slotPrice}>{priceBRL}</Text>}
                    <View style={styles.condTag}><Text style={styles.condText}>{slot.condition}</Text></View>
                  </>
                ) : (
                  <View style={styles.slotEmpty}>
                    <Ionicons name="add" size={22} color={Colors.ash} />
                    <Text style={styles.slotNum}>{pos + 1}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={selectedSlot !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Slot {(selectedSlot ?? 0) + 1}</Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={22} color={Colors.ash} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            {(['search', 'scan'] as AddMode[]).map(mode => (
              <TouchableOpacity
                key={mode}
                style={[styles.tab, addMode === mode && styles.tabActive]}
                onPress={() => { setAddMode(mode); setPendingCard(null); setScanResult(null); }}
              >
                <Ionicons name={mode === 'search' ? 'search' : 'camera'} size={16} color={addMode === mode ? Colors.gold : Colors.ash} />
                <Text style={[styles.tabTxt, addMode === mode && styles.tabTxtActive]}>
                  {mode === 'search' ? 'Buscar' : 'Scan'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ABA BUSCAR */}
          {addMode === 'search' ? (
            <View style={{ flex: 1 }}>
              {pendingCard ? (
                <ScrollView contentContainerStyle={{ padding: 14, gap: 16 }}>
                  <View style={styles.pendingRow}>
                    <Image source={{ uri: pendingCard.images.small }} style={styles.pendingImg} resizeMode="contain" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pendingName}>{pendingCard.name}</Text>
                      <Text style={styles.pendingSet}>{pendingCard.set.name} · #{pendingCard.number}</Text>
                      <Text style={styles.pendingRarity}>{pendingCard.rarity}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setPendingCard(null)} style={{ padding: 4 }}>
                      <Ionicons name="close-circle" size={20} color={Colors.ash} />
                    </TouchableOpacity>
                  </View>

                  {getBasePrice(pendingCard) && rate ? (
                    <View style={styles.priceHighlight}>
                      <Text style={styles.priceHighlightLabel}>Valor estimado ({pendingCondition})</Text>
                      <Text style={styles.priceHighlightValue}>
                        {priceForCondition(pendingCard, pendingCondition, rate)}
                      </Text>
                    </View>
                  ) : null}

                  <ConditionPicker card={pendingCard} selected={pendingCondition} onSelect={setPendingCondition} />

                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => handleConfirmAdd(pendingCard, pendingCondition)}
                    disabled={adding}
                  >
                    {adding
                      ? <ActivityIndicator color={Colors.void} size="small" />
                      : <Text style={styles.confirmBtnTxt}>Adicionar ao slot</Text>}
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                <>
                  <View style={styles.searchRow}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Nome da carta em inglês..."
                      placeholderTextColor={Colors.ash}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      onSubmitEditing={handleSearch}
                      returnKeyType="search"
                    />
                    <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
                      {searching
                        ? <ActivityIndicator color={Colors.void} size="small" />
                        : <Ionicons name="search" size={18} color={Colors.void} />}
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={searchResults}
                    keyExtractor={c => c._id}
                    contentContainerStyle={{ padding: 12, gap: 10 }}
                    renderItem={({ item }) => {
                      const nmPrice = priceForCondition(item, 'NM', rate);
                      return (
                        <TouchableOpacity style={styles.resultRow} onPress={() => handlePickCard(item)}>
                          <Image source={{ uri: item.images.small }} style={styles.resultImg} resizeMode="contain" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resultName}>{item.name}</Text>
                            <Text style={styles.resultSet}>{item.set.name} · #{item.number}</Text>
                            <Text style={styles.resultRarity}>{item.rarity}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            {nmPrice
                              ? <><Text style={styles.resultPrice}>{nmPrice}</Text><Text style={styles.resultPriceLabel}>NM</Text></>
                              : <Text style={styles.resultNoPrice}>s/ preço</Text>
                            }
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </>
              )}
            </View>
          ) : (
            /* ABA SCAN */
            <View style={{ flex: 1 }}>
              {scanResult ? (
                /* Resultado do scan — igual mobile e web */
                <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
                  <View style={styles.scanResultCard}>
                    <Text style={styles.scanLabel}>Carta identificada</Text>
                    <Text style={styles.scanResultName}>{scanResult.name}</Text>
                    {scanResult.set ? <Text style={styles.scanResultSub}>{scanResult.set}</Text> : null}
                    <View style={styles.scanConfRow}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.mint} />
                      <Text style={styles.scanConf}>Confiança: {Math.round(scanResult.confidence * 100)}%</Text>
                    </View>
                  </View>

                  {scanCandidates.length > 0 ? (
                    <>
                      <Text style={styles.candidatesTitle}>Confirmar versão:</Text>
                      {scanCandidates.map((c, i) => {
                        const nmPrice = priceForCondition(c, 'NM', rate);
                        return (
                          <TouchableOpacity
                            key={`${c._id}-${i}`}
                            style={styles.resultRow}
                            onPress={() => handlePickCard(c)}
                            disabled={adding}
                          >
                            <Image source={{ uri: c.images.small }} style={styles.resultImg} resizeMode="contain" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.resultName}>{c.name}</Text>
                              <Text style={styles.resultSet}>{c.set?.name} · #{(c as any).number}</Text>
                              <Text style={styles.resultRarity}>{(c as any).rarity}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: 4 }}>
                              {nmPrice
                                ? <><Text style={styles.resultPrice}>{nmPrice}</Text><Text style={styles.resultPriceLabel}>NM</Text></>
                                : <Text style={styles.resultNoPrice}>s/ preço</Text>
                              }
                            </View>
                          </TouchableOpacity>
                        );
                      })}

                      {pendingCard && (
                        <View style={{ gap: 14 }}>
                          <View style={styles.pendingRow}>
                            <Image source={{ uri: pendingCard.images.small }} style={styles.pendingImg} resizeMode="contain" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.pendingName}>{pendingCard.name}</Text>
                              <Text style={styles.pendingSet}>{pendingCard.set?.name} · #{(pendingCard as any).number}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setPendingCard(null)} style={{ padding: 4 }}>
                              <Ionicons name="close-circle" size={20} color={Colors.ash} />
                            </TouchableOpacity>
                          </View>

                          {getBasePrice(pendingCard) && rate ? (
                            <View style={styles.priceHighlight}>
                              <Text style={styles.priceHighlightLabel}>Valor estimado ({editedCondition})</Text>
                              <Text style={styles.priceHighlightValue}>
                                {priceForCondition(pendingCard, editedCondition, rate)}
                              </Text>
                            </View>
                          ) : null}

                          <ConditionPicker
                            card={pendingCard}
                            selected={editedCondition}
                            onSelect={setEditedCondition}
                            hint={scanResult.conditionReason}
                          />

                          <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={() => handleConfirmAdd(pendingCard, editedCondition)}
                            disabled={adding}
                          >
                            {adding
                              ? <ActivityIndicator color={Colors.void} size="small" />
                              : <Text style={styles.confirmBtnTxt}>Adicionar ao slot</Text>}
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  ) : (
                    <TouchableOpacity style={styles.searchByNameBtn} onPress={() => {
                      setSearchQuery(scanResult.name);
                      setScanResult(null);
                      setAddMode('search');
                    }}>
                      <Ionicons name="search" size={16} color={Colors.gold} />
                      <Text style={styles.searchByNameTxt}>Buscar "{scanResult.name}" manualmente</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.rescanBtn} onPress={() => { setScanResult(null); setPendingCard(null); }}>
                    <Text style={{ color: Colors.ash, fontSize: 14 }}>↩ {Platform.OS === 'web' ? 'Enviar outra foto' : 'Escanear novamente'}</Text>
                  </TouchableOpacity>
                </ScrollView>
              ) : Platform.OS === 'web' ? (
                /* SCAN WEB — upload de arquivo */
                <View style={styles.webScanBox}>
                  <Ionicons name="scan-outline" size={56} color={Colors.ash} />
                  <Text style={styles.webScanTitle}>Identificar carta por foto</Text>
                  <Text style={styles.webScanSub}>
                    Selecione uma foto da carta para identificá-la com IA (Claude Vision)
                  </Text>
                  <TouchableOpacity style={styles.snapBtn} onPress={handleWebScan} disabled={scanning}>
                    {scanning
                      ? <><ActivityIndicator color={Colors.void} /><Text style={styles.snapTxt}>Identificando...</Text></>
                      : <><Ionicons name="images" size={22} color={Colors.void} /><Text style={styles.snapTxt}>Selecionar foto</Text></>}
                  </TouchableOpacity>
                </View>
              ) : (
                /* SCAN MOBILE — câmera */
                !permission?.granted ? (
                  <View style={styles.permBox}>
                    <Ionicons name="camera-outline" size={48} color={Colors.ash} />
                    <Text style={styles.permText}>Precisamos da câmera para identificar a carta</Text>
                    <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                      <Text style={styles.permBtnTxt}>Permitir câmera</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    <CameraView ref={cameraRef} style={styles.camera} facing="back">
                      <View style={styles.cameraOverlay}>
                        <View style={styles.cameraFrame} />
                        <Text style={styles.cameraHint}>Enquadre a carta no centro</Text>
                      </View>
                    </CameraView>
                    <TouchableOpacity style={styles.snapBtn} onPress={handleScan} disabled={scanning}>
                      {scanning
                        ? <><ActivityIndicator color={Colors.void} /><Text style={styles.snapTxt}>Identificando...</Text></>
                        : <><Ionicons name="camera" size={26} color={Colors.void} /><Text style={styles.snapTxt}>Identificar carta</Text></>}
                    </TouchableOpacity>
                  </View>
                )
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: Colors.void },
  center:              { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.void },
  header:              { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:             { padding: 4 },
  binderName:          { fontSize: 18, fontWeight: '700', color: Colors.snow },
  binderMeta:          { fontSize: 13, color: Colors.ash, marginTop: 2 },
  gridContainer:       { padding: 12 },
  grid:                { flexDirection: 'row', flexWrap: 'wrap' },
  slot:                { aspectRatio: 0.72, backgroundColor: Colors.surface, borderRadius: 8, overflow: 'hidden', position: 'relative', marginBottom: 8 },
  slotImg:             { width: '100%', height: '100%' },
  slotEmpty:           { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  slotNum:             { fontSize: 10, color: Colors.border },
  slotPrice:           { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.75)', fontSize: 9, color: Colors.gold, textAlign: 'center', padding: 2 },
  condTag:             { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  condText:            { fontSize: 8, color: Colors.snow, fontWeight: '700' },
  modal:               { flex: 1, backgroundColor: Colors.void },
  modalHandle:         { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  modalHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  modalTitle:          { fontSize: 16, fontWeight: '700', color: Colors.snow },
  tabs:                { flexDirection: 'row', marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 10, padding: 4, gap: 4, marginBottom: 4 },
  tab:                 { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 8 },
  tabActive:           { backgroundColor: Colors.surface2 },
  tabTxt:              { fontSize: 14, color: Colors.ash },
  tabTxtActive:        { color: Colors.gold, fontWeight: '600' },
  searchRow:           { flexDirection: 'row', margin: 12, gap: 8 },
  searchInput:         { flex: 1, backgroundColor: Colors.surface, borderRadius: 10, padding: 12, color: Colors.snow, fontSize: 14 },
  searchBtn:           { backgroundColor: Colors.gold, borderRadius: 10, width: 46, alignItems: 'center', justifyContent: 'center' },
  resultRow:           { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 10, padding: 10, gap: 12 },
  resultImg:           { width: 44, height: 61, borderRadius: 4 },
  resultName:          { fontSize: 14, fontWeight: '600', color: Colors.snow },
  resultSet:           { fontSize: 12, color: Colors.ash, marginTop: 2 },
  resultRarity:        { fontSize: 11, color: Colors.gold, marginTop: 2 },
  resultPrice:         { fontSize: 13, fontWeight: '700', color: Colors.mint },
  resultPriceLabel:    { fontSize: 10, color: Colors.ash },
  resultNoPrice:       { fontSize: 11, color: Colors.border },
  pendingRow:          { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 12 },
  pendingImg:          { width: 54, height: 75, borderRadius: 6 },
  pendingName:         { fontSize: 16, fontWeight: '700', color: Colors.snow },
  pendingSet:          { fontSize: 12, color: Colors.ash, marginTop: 2 },
  pendingRarity:       { fontSize: 11, color: Colors.gold, marginTop: 2 },
  priceHighlight:      { backgroundColor: Colors.surface2, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.gold + '44' },
  priceHighlightLabel: { fontSize: 13, color: Colors.ash },
  priceHighlightValue: { fontSize: 20, fontWeight: '700', color: Colors.gold },
  condLabel:           { fontSize: 13, fontWeight: '600', color: Colors.snow },
  condPickerHint:      { fontSize: 12, color: Colors.ash, marginBottom: 4 },
  condRow:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: 10, padding: 12, borderWidth: 1.5, borderColor: Colors.border },
  condRowActive:       { borderColor: Colors.gold, backgroundColor: Colors.surface2 },
  condRowLeft:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  condGrade:           { fontSize: 13, fontWeight: '800', color: Colors.ash, width: 34 },
  condGradeActive:     { color: Colors.gold },
  condName:            { fontSize: 13, color: Colors.ash },
  condNameActive:      { color: Colors.snow },
  condPrice:           { fontSize: 13, fontWeight: '700', color: Colors.ash },
  condPriceActive:     { color: Colors.mint },
  condNoPrice:         { fontSize: 12, color: Colors.border },
  noPriceNote:         { fontSize: 11, color: Colors.ash, textAlign: 'center', fontStyle: 'italic' },
  confirmBtn:          { backgroundColor: Colors.gold, borderRadius: 12, padding: 15, alignItems: 'center' },
  confirmBtnTxt:       { fontSize: 15, fontWeight: '700', color: Colors.void },
  // Câmera mobile
  camera:              { flex: 1 },
  cameraOverlay:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  cameraFrame:         { width: 220, height: 308, borderWidth: 2, borderColor: Colors.gold, borderRadius: 12 },
  cameraHint:          { color: Colors.snow, fontSize: 13, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  snapBtn:             { backgroundColor: Colors.gold, margin: 16, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  snapTxt:             { fontSize: 15, fontWeight: '700', color: Colors.void },
  permBox:             { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  permText:            { fontSize: 15, color: Colors.ash, textAlign: 'center' },
  permBtn:             { backgroundColor: Colors.gold, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnTxt:          { fontSize: 15, fontWeight: '700', color: Colors.void },
  // Scan web
  webScanBox:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  webScanTitle:        { fontSize: 18, fontWeight: '700', color: Colors.snow, textAlign: 'center' },
  webScanSub:          { fontSize: 14, color: Colors.ash, textAlign: 'center', lineHeight: 20 },
  // Scan resultado
  scanResultCard:      { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, gap: 6 },
  scanLabel:           { fontSize: 11, color: Colors.ash, textTransform: 'uppercase', letterSpacing: 0.5 },
  scanResultName:      { fontSize: 20, fontWeight: '700', color: Colors.snow },
  scanResultSub:       { fontSize: 13, color: Colors.ash },
  scanConfRow:         { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  scanConf:            { fontSize: 12, color: Colors.mint },
  candidatesTitle:     { fontSize: 14, fontWeight: '600', color: Colors.snow },
  rescanBtn:           { alignItems: 'center', padding: 12 },
  searchByNameBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.gold + '55' },
  searchByNameTxt:     { fontSize: 13, color: Colors.gold, flex: 1 },
});
