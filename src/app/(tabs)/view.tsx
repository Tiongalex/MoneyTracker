import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTransactionStore } from '@/store/useTransactionStore';
import SwipeableTransaction from '@/components/SwipeableTransaction';

type Period = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => (currentYear - 3 + i).toString());

// Date helpers
function getTodayISO() {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  return localISOTime;
}

function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  const end = new Date(now);
  end.setDate(now.getDate() + (6 - day));
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

function getMonthRange(monthIndex: number, year: number): { start: string; end: string } {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

function getYearRange(year: number): { start: string; end: string } {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
}

export default function ViewScreen() {
  const now = new Date();
  const [period, setPeriod] = useState<Period>('Monthly');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());

  const { transactions, summary, categorySpending, loadByDay, loadByDateRange, remove } =
    useTransactionStore();

  // Reload data whenever this screen is focused or filters change
  const loadData = useCallback(() => {
    const year = parseInt(selectedYear);

    if (period === 'Daily') {
      loadByDay(getTodayISO());
    } else if (period === 'Weekly') {
      const { start, end } = getWeekRange();
      loadByDateRange(start, end);
    } else if (period === 'Monthly') {
      const { start, end } = getMonthRange(selectedMonthIndex, year);
      loadByDateRange(start, end);
    } else if (period === 'Yearly') {
      const { start, end } = getYearRange(year);
      loadByDateRange(start, end);
    }
  }, [period, selectedMonthIndex, selectedYear]);

  // Reload when screen comes into focus (e.g. after adding a transaction)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            remove(id);
            loadData();
          },
        },
      ]
    );
  };

  // Max category total for bar chart scaling
  const maxCategoryTotal = Math.max(...categorySpending.map((c) => c.total), 1);

  const CHART_COLORS = ['#5b4fcf', '#1d9e75', '#d85a30', '#ba7517', '#e24b4a', '#3a86ff'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Overview</Text>

        {/* Period Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Month Selector */}
        {period === 'Monthly' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {MONTHS.map((m, i) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, selectedMonthIndex === i && styles.chipActive]}
                onPress={() => setSelectedMonthIndex(i)}
              >
                <Text style={[styles.chipText, selectedMonthIndex === i && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Year Selector */}
        {(period === 'Monthly' || period === 'Yearly') && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {YEARS.map((y) => (
              <TouchableOpacity
                key={y}
                style={[styles.chip, selectedYear === y && styles.chipActive]}
                onPress={() => setSelectedYear(y)}
              >
                <Text style={[styles.chipText, selectedYear === y && styles.chipTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {period === 'Daily' && (
          <Text style={styles.dateLabel}>
            {new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        )}

        {period === 'Weekly' && (
          <Text style={styles.dateLabel}>This week</Text>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: '#e24b4a' }]}>
              RM{summary.totalExpense.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, { color: '#1d9e75' }]}>
              RM{summary.totalIncome.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={[styles.summaryValue, { color: '#5b4fcf' }]}>
              {summary.net < 0 ? `-RM${Math.abs(summary.net).toFixed(2)}` : `RM${summary.net.toFixed(2)}`}
            </Text>
          </View>
        </View>

        {/* Bar Chart */}
        {categorySpending.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spending by category</Text>
            {categorySpending.map((cat, index) => (
              <View key={cat.category_id} style={styles.barRow}>
                <Text style={styles.barIcon}>{cat.category_icon}</Text>
                <Text style={styles.barLabel} numberOfLines={1}>{cat.category_name}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${(cat.total / maxCategoryTotal) * 100}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barAmt}>RM{cat.total.toFixed(0)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Transaction List */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRANSACTIONS</Text>

          {transactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubText}>Add one from the Add tab!</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {transactions.map((tx, index) => (
                <SwipeableTransaction
                  key={tx.id}
                  transaction={tx}
                  onDelete={(id) => {
                    remove(id);
                    loadData();
                  }}
                  showDivider={index < transactions.length - 1}
                />
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { flex: 1, backgroundColor: '#f4f4f6' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 32 },

  // Header
  header: { backgroundColor: '#1a1a2e', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: '500', color: '#fff' },
  chipScroll: { flexGrow: 0 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginRight: 6, backgroundColor: 'rgba(255,255,255,0.1)' },
  periodBtnActive: { backgroundColor: '#fff' },
  periodBtnText: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  periodBtnTextActive: { color: '#1a1a2e', fontWeight: '500' },
  chip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginRight: 6, backgroundColor: 'rgba(255,255,255,0.1)' },
  chipActive: { backgroundColor: '#fff' },
  chipText: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  chipTextActive: { color: '#1a1a2e', fontWeight: '500' },
  dateLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 0.5, borderColor: '#e5e5e5', padding: 10 },
  summaryLabel: { fontSize: 10, color: '#999', marginBottom: 4 },
  summaryValue: { fontSize: 13, fontWeight: '500' },

  // Card
  card: { 
  backgroundColor: '#fff', 
  borderRadius: 12, 
  borderWidth: 0.5, 
  borderColor: '#e5e5e5', 
  padding: 14, 
  gap: 0,    // ← change from 12 to 0
  },
  cardTitle: { fontSize: 13, fontWeight: '500', color: '#333' },

  // Bar chart
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barIcon: { fontSize: 14 },
  barLabel: { fontSize: 11, color: '#888', width: 72 },
  barTrack: { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barAmt: { fontSize: 11, color: '#333', fontWeight: '500', width: 52, textAlign: 'right' },

  // Transactions
  section: { gap: 8 },
  sectionLabel: { fontSize: 11, color: '#999', fontWeight: '500', letterSpacing: 0.6 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eeedfe', alignItems: 'center', justifyContent: 'center' },
  txIconIncome: { backgroundColor: '#e1f5ee' },
  txIcon: { fontSize: 16 },
  txInfo: { flex: 1 },
  txCat: { fontSize: 13, fontWeight: '500', color: '#333' },
  txDesc: { fontSize: 11, color: '#999' },
  txDate: { fontSize: 10, color: '#bbb', marginTop: 1 },
  txAmt: { fontSize: 13, fontWeight: '500' },
  txAmtNeg: { color: '#e24b4a' },
  txAmtPos: { color: '#1d9e75' },
  divider: { height: 0.5, backgroundColor: '#f0f0f0', marginVertical: 4 },

  // Empty state
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#e5e5e5', padding: 32, alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 15, fontWeight: '500', color: '#555' },
  emptySubText: { fontSize: 12, color: '#aaa' },
});