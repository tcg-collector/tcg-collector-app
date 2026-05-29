import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Image, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { useBinders } from '../../hooks/useBinders';
import { GRID_CONFIGS, GridConfig } from '../../services/binders';

// Alert web-safe
function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function CreateBinderScreen() {
  const router = useRouter();
  const { createBinder } = useBinders();
  const [name, setName] = useState('');
  const [grid, setGrid] = useState<GridConfig>('3x3');
  const [cover, setCover] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickCover = async () => {
    if (Platform.OS === 'web') {
      // No web: usa input file nativo
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const uri = e.target?.result as string;
          if (uri) setCover(uri);
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permissão necessária', 'Precisamos de acesso à galeria para a foto de capa.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
      base64: false,
    });
    if (!result.canceled) setCover(result.assets[0].uri);
  };

  const takeCover = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permissão necessária', 'Precisamos da câmera para tirar a foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });
    if (!result.canceled) setCover(result.assets[0].uri);
  };

  const handleCreate = async () => {
    if (!name.trim()) { showAlert('Nome obrigatório', 'Dê um nome ao seu binder.'); return; }
    setSaving(true);
    try {
      const binder = await createBinder(name.trim(), grid, cover ?? undefined);
      router.replace(`/binder/${binder._id}`);
    } catch (e) {
      showAlert('Erro', e instanceof Error ? e.message : 'Não foi possível criar o binder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Foto de capa */}
      <Text style={styles.label}>Foto de capa</Text>
      <View style={styles.coverArea}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.coverPreview} resizeMode="cover" />
        ) : (
          <View style={styles.coverEmpty}>
            <Ionicons name="image-outline" size={40} color={Colors.ash} />
            <Text style={styles.coverHint}>Opcional</Text>
          </View>
        )}
        <View style={styles.coverBtns}>
          <TouchableOpacity style={styles.coverBtn} onPress={pickCover}>
            <Ionicons name="images-outline" size={18} color={Colors.snow} />
            <Text style={styles.coverBtnTxt}>Galeria</Text>
          </TouchableOpacity>
          {/* Câmera só no mobile */}
          {Platform.OS !== 'web' && (
            <TouchableOpacity style={styles.coverBtn} onPress={takeCover}>
              <Ionicons name="camera-outline" size={18} color={Colors.snow} />
              <Text style={styles.coverBtnTxt}>Câmera</Text>
            </TouchableOpacity>
          )}
          {cover && (
            <TouchableOpacity style={[styles.coverBtn, styles.coverBtnRemove]} onPress={() => setCover(null)}>
              <Ionicons name="trash-outline" size={18} color={Colors.crimson} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Nome */}
      <Text style={styles.label}>Nome do binder</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Base Set Completo, Coleção Japonesa..."
        placeholderTextColor={Colors.ash}
        value={name}
        onChangeText={setName}
        maxLength={40}
      />

      {/* Grid */}
      <Text style={styles.label}>Configuração do grid</Text>
      <View style={styles.gridOptions}>
        {GRID_CONFIGS.map(cfg => (
          <TouchableOpacity
            key={cfg.value}
            style={[styles.gridOption, grid === cfg.value && styles.gridOptionActive]}
            onPress={() => setGrid(cfg.value)}
          >
            <View style={[styles.gridMini, { aspectRatio: cfg.cols / cfg.rows }]}>
              {Array.from({ length: cfg.cols * cfg.rows }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.gridMiniCell,
                    { width: `${100 / cfg.cols - 3}%` as any },
                    grid === cfg.value && styles.gridMiniCellActive,
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.gridLabel, grid === cfg.value && styles.gridLabelActive]}>
              {cfg.label}
            </Text>
            <Text style={styles.gridSub}>{cfg.cols * cfg.rows} cartas/pág</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Criar */}
      <TouchableOpacity
        style={[styles.createBtn, saving && { opacity: 0.6 }]}
        onPress={handleCreate}
        disabled={saving}
      >
        <Ionicons name="book" size={20} color={Colors.void} />
        <Text style={styles.createBtnTxt}>{saving ? 'Criando...' : 'Criar binder'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.void },
  content:    { padding: 20, paddingBottom: 40 },
  label:      { fontSize: 13, fontWeight: '600', color: Colors.ash, marginBottom: 8, marginTop: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  coverArea:  { backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden' },
  coverPreview: { width: '100%', height: 200 },
  coverEmpty: { height: 140, alignItems: 'center', justifyContent: 'center', gap: 8 },
  coverHint:  { fontSize: 13, color: Colors.ash },
  coverBtns:  { flexDirection: 'row', gap: 8, padding: 12 },
  coverBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface2, borderRadius: 10, padding: 10, gap: 6 },
  coverBtnRemove: { flex: 0, paddingHorizontal: 14, backgroundColor: Colors.surface2 },
  coverBtnTxt:{ fontSize: 13, color: Colors.snow },
  input:      { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, fontSize: 15, color: Colors.snow, borderWidth: 1, borderColor: Colors.border },
  gridOptions:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridOption: { flex: 1, minWidth: '45%', backgroundColor: Colors.surface, borderRadius: 12, padding: 12, alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.border },
  gridOptionActive: { borderColor: Colors.gold, backgroundColor: Colors.surface2 },
  gridMini:   { width: '60%', flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  gridMiniCell: { aspectRatio: 0.72, borderRadius: 2, backgroundColor: Colors.border },
  gridMiniCellActive: { backgroundColor: Colors.gold + '88' },
  gridLabel:  { fontSize: 15, fontWeight: '700', color: Colors.ash },
  gridLabelActive: { color: Colors.gold },
  gridSub:    { fontSize: 11, color: Colors.ash },
  createBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gold, borderRadius: 14, padding: 16, gap: 8, marginTop: 32 },
  createBtnTxt: { fontSize: 16, fontWeight: '700', color: Colors.void },
});
