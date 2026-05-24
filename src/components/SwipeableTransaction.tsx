import { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { Transaction } from '@/database/transactions';

interface Props {
  transaction: Transaction;
  onDelete: (id: number) => void;
  showDivider: boolean;
}

const DELETE_BTN_WIDTH = 70;
const SWIPE_THRESHOLD = 10;

export default function SwipeableTransaction({ transaction: tx, onDelete, showDivider }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe (negative dx), max to DELETE_BTN_WIDTH
        const newX = Math.max(-DELETE_BTN_WIDTH, Math.min(0, gestureState.dx));
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swiped far enough — open delete button
          openDelete();
        } else {
          // Not far enough — snap back
          closeDelete();
        }
      },
    })
  ).current;

  const openDelete = () => {
    Animated.spring(translateX, {
      toValue: -DELETE_BTN_WIDTH,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
    setIsOpen(true);
  };

  const closeDelete = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
    setIsOpen(false);
  };

  const handleDelete = () => {
    // Animate out before deleting
    Animated.timing(translateX, {
      toValue: -300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDelete(tx.id);
    });
  };

  return (
    <View style={styles.container}>
      {/* Delete button behind the row */}
      <View style={styles.deleteContainer}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Image
          source={require('@/assets/images/delete.png')}
          style={styles.deleteImage}
        />
        </TouchableOpacity>
      </View>

      {/* Swipeable row */}
      <Animated.View
        style={[styles.rowWrapper, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {/* Tap anywhere on row to close if open */}
        <TouchableWithoutFeedback onPress={isOpen ? closeDelete : undefined}>
          <View style={styles.txRow}>
            <View style={[styles.txIconWrap, tx.type === 'income' && styles.txIconIncome]}>
              <Text style={styles.txIcon}>{tx.category_icon}</Text>
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txCat}>{tx.category_name}</Text>
              {tx.note ? <Text style={styles.txDesc}>{tx.note}</Text> : null}
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>
            <Text style={[styles.txAmt, tx.type === 'expense' ? styles.txAmtNeg : styles.txAmtPos]}>
              {tx.type === 'expense' ? '-' : '+'}RM{tx.amount.toFixed(2)}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Divider */}
      {showDivider && <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
  },
  deleteContainer: {
    position: 'absolute',
    right: 8,          // ← gap from edge
    top: '15%',        // ← doesn't fill full height
    bottom: '15%',     // ← more compact
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e24b4a',
    borderRadius: 12,  // ← more rounded
  },
  deleteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',    // ← fill container width
    height: '100%',   // ← fill container height
    padding: 8,       // ← gives icon breathing room
  },
  deleteIcon: { fontSize: 18 },
  deleteText: { fontSize: 11, color: '#fff', fontWeight: '500' },

  rowWrapper: {
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 2,
    backgroundColor: '#fff',
    minHeight: 56,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eeedfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteImage: {
  width: 20,
  height: 20,
  resizeMode: 'contain',
},
  txIconIncome: { backgroundColor: '#e1f5ee' },
  txIcon: { fontSize: 16 },
  txInfo: { flex: 1 },
  txCat: { fontSize: 13, fontWeight: '500', color: '#333' },
  txDesc: { fontSize: 11, color: '#999' },
  txDate: { fontSize: 10, color: '#bbb', marginTop: 1 },
  txAmt: { fontSize: 13, fontWeight: '500' },
  txAmtNeg: { color: '#e24b4a' },
  txAmtPos: { color: '#1d9e75' },
  divider: { height: 0.5, backgroundColor: '#f0f0f0' },
});