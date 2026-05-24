import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Modal,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useTransactionStore } from '@/store/useTransactionStore';

const CATEGORY_ICONS = [
  '🍔', '🍕', '🍜', '🍣', '☕', '🧃',
  '🎮', '🎵', '🎬', '📚', '🎨', '🎯',
  '🚗', '✈️', '🚌', '🛵', '⛽', '🚢',
  '🛒', '👗', '👟', '💄', '🧴', '🛍️',
  '💡', '💧', '🔌', '📱', '🖥️', '🏠',
  '🏥', '💊', '🏋️', '🧘', '🩺', '❤️',
  '🎓', '✏️', '📖', '🔬', '🎒', '📝',
  '💰', '💳', '🏦', '📈', '💎', '🪙',
  '🐾', '🌿', '⚽', '🎁', '💼', '🌟',
];

export default function AddScreen() {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);
  const [showIconDropdown, setShowIconDropdown] = useState(false);

  const { categories, load: loadCategories, add: addCategory, remove: removeCategory } = useCategoryStore();
  const { add: addTransaction } = useTransactionStore();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories]);

  useEffect(() => {
    if (showAddCategory) {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [showAddCategory]);

  const today = new Date().toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const todayISO = new Date().toISOString().split('T')[0];

  const handleSave = () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('No category', 'Please select a category.');
      return;
    }
    addTransaction({
      amount: parsed,
      type,
      category_id: selectedCategoryId,
      note: note.trim() || undefined,
      date: todayISO,
    });
    setAmount('');
    setNote('');
    setType('expense');
    setSelectedCategoryId(categories[0]?.id ?? null);
    Alert.alert('Saved!', 'Transaction has been recorded successfully.');
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Missing name', 'Please enter a category name.');
      return;
    }
    addCategory({ name: newCategoryName.trim(), icon: selectedIcon });
    setNewCategoryName('');
    setSelectedIcon(CATEGORY_ICONS[0]);
    setShowIconDropdown(false);
    setShowAddCategory(false);
  };

  const handleLongPressCategory = (id: number, name: string, isDefault: number) => {
    if (isDefault === 1) {
      Alert.alert('Cannot delete', `"${name}" is a default category and cannot be deleted.`);
      return;
    }
    Alert.alert(
      'Delete category',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const success = removeCategory(id);
            if (!success) {
              Alert.alert('Error', 'Could not delete this category.');
            } else if (selectedCategoryId === id) {
              setSelectedCategoryId(categories[0]?.id ?? null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount Card */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Enter amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>RM</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="decimal-pad"
                selectionColor="#fff"
              />
            </View>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catItem, selectedCategoryId === cat.id && styles.catItemSelected]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  onLongPress={() => handleLongPressCategory(cat.id, cat.name, cat.is_default)}
                  delayLongPress={600}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={[styles.catName, selectedCategoryId === cat.id && styles.catNameSelected]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.catAdd} onPress={() => setShowAddCategory(true)}>
                <Text style={styles.catAddIcon}>＋</Text>
                <Text style={styles.catAddText}>Add new</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Note & Date */}
          <View style={styles.fieldCard}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Note</Text>
              <TextInput
                style={styles.fieldInput}
                value={note}
                onChangeText={setNote}
                placeholder="Add a note..."
                placeholderTextColor="#bbb"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Date</Text>
              <Text style={styles.fieldValue}>{today}</Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save transaction</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Add Category Modal */}
        <Modal visible={showAddCategory} transparent animationType="fade">
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Animated.View
              style={[styles.modalOverlay, { opacity: overlayOpacity }]}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => {
                  setShowIconDropdown(false);
                  setShowAddCategory(false);
                }}
              />
            </Animated.View>

            <Animated.View style={[styles.modalSlide, { transform: [{ translateY: slideAnim }] }]}>
              <TouchableOpacity activeOpacity={1} onPress={() => setShowIconDropdown(false)}>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>New category</Text>

                  <TextInput
                    style={styles.modalInput}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="Category name"
                    placeholderTextColor="#bbb"
                    autoFocus
                  />

                  <Text style={styles.iconPickerLabel}>Choose icon</Text>

                  <TouchableOpacity
                    style={styles.iconDropdownTrigger}
                    onPress={() => setShowIconDropdown(!showIconDropdown)}
                  >
                    <Text style={styles.iconDropdownSelected}>{selectedIcon}</Text>
                    <Text style={styles.iconDropdownName}>Tap to change</Text>
                    <Text style={styles.iconDropdownArrow}>{showIconDropdown ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {showIconDropdown && (
                    <View style={styles.iconDropdownPanel}>
                      <ScrollView style={styles.iconDropdownScroll} nestedScrollEnabled>
                        <View style={styles.iconGrid}>
                          {CATEGORY_ICONS.map((icon) => (
                            <TouchableOpacity
                              key={icon}
                              style={[
                                styles.iconItem,
                                selectedIcon === icon && styles.iconItemSelected,
                              ]}
                              onPress={() => {
                                setSelectedIcon(icon);
                                setShowIconDropdown(false);
                              }}
                            >
                              <Text style={styles.iconItemText}>{icon}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  )}

                  <View style={styles.modalBtns}>
                    <TouchableOpacity
                      style={styles.modalCancel}
                      onPress={() => {
                        setNewCategoryName('');
                        setSelectedIcon(CATEGORY_ICONS[0]);
                        setShowIconDropdown(false);
                        setShowAddCategory(false);
                      }}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalSave} onPress={handleAddCategory}>
                      <Text style={styles.modalSaveText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { flex: 1, backgroundColor: '#f4f4f6' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 100 },
  amountCard: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20 },
  amountLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, letterSpacing: 0.5 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currency: { fontSize: 22, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  amountInput: { flex: 1, fontSize: 38, fontWeight: '500', color: '#fff' },
  typeToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 3, marginTop: 14 },
  typeBtn: { flex: 1, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#fff' },
  typeBtnText: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  typeBtnTextActive: { color: '#1a1a2e', fontWeight: '500' },
  section: { gap: 8 },
  sectionLabel: { fontSize: 11, color: '#999', fontWeight: '500', letterSpacing: 0.6 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  catItem: {
    flex: 1,
    minWidth: '30%',
    maxWidth: '32%',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  catItemSelected: { borderColor: '#5b4fcf', backgroundColor: '#eeedfe' },
  catIcon: { fontSize: 26, lineHeight: 32, textAlign: 'center' },
  catName: { fontSize: 10, color: '#888', textAlign: 'center', paddingHorizontal: 4 },
  catNameSelected: { color: '#3c3489', fontWeight: '500' },
  catAdd: {
    flex: 1,
    minWidth: '30%',
    maxWidth: '32%',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#d0cdf7',
    borderStyle: 'dashed',
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  catAddIcon: { fontSize: 18, color: '#5b4fcf' },
  catAddText: { fontSize: 10, color: '#5b4fcf' },
  fieldCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#e5e5e5', padding: 14, gap: 10 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 13, color: '#999' },
  fieldInput: { flex: 1, textAlign: 'right', fontSize: 13, color: '#333' },
  fieldValue: { fontSize: 13, color: '#333', fontWeight: '500' },
  divider: { height: 0.5, backgroundColor: '#eee' },
  saveBtn: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSlide: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 14 },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a2e' },
  modalInput: { borderWidth: 0.5, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 14, color: '#333' },
  iconPickerLabel: { fontSize: 12, color: '#999', fontWeight: '500' },
  iconDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    backgroundColor: '#fafafa',
  },
  iconDropdownSelected: { fontSize: 22 },
  iconDropdownName: { flex: 1, fontSize: 13, color: '#555' },
  iconDropdownArrow: { fontSize: 11, color: '#aaa' },
  iconDropdownPanel: {
    borderWidth: 0.5,
    borderColor: '#eee',
    borderRadius: 10,
    overflow: 'hidden',
    maxHeight: 200,
  },
  iconDropdownScroll: { padding: 8 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  iconItem: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  iconItemSelected: { borderColor: '#5b4fcf', backgroundColor: '#eeedfe', borderWidth: 1.5 },
  iconItemText: { fontSize: 20 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, padding: 13, borderRadius: 10, borderWidth: 0.5, borderColor: '#ddd', alignItems: 'center' },
  modalCancelText: { fontSize: 14, color: '#888' },
  modalSave: { flex: 1, padding: 13, borderRadius: 10, backgroundColor: '#1a1a2e', alignItems: 'center' },
  modalSaveText: { fontSize: 14, color: '#fff', fontWeight: '500' },
});