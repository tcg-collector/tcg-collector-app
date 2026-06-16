import { TouchableOpacity, Image, Text, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/colors';
import type { Card } from '../services/cards';

interface Props {
  card: Card;
  priceBRL: string;
  badge?: string;
  onPress: () => void;
}

export function MarketCardItem({ card, priceBRL, badge, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Image
        source={{ uri: card.images.small }}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.name} numberOfLines={1}>{card.name}</Text>
      <Text style={styles.set} numberOfLines={1}>{card.set.name}</Text>
      <Text style={styles.price}>{priceBRL}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 130,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 10,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.mint,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.void,
  },
  image: {
    width: '100%',
    height: 110,
    borderRadius: 6,
    marginBottom: 8,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.snow,
  },
  set: {
    fontSize: 10,
    color: Colors.ash,
    marginTop: 2,
  },
  price: {
    fontSize: 12,
    color: Colors.mint,
    marginTop: 4,
    fontWeight: '600',
  },
});
