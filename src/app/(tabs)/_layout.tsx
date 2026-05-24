import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ label, focused, icon }: { label: string; focused: boolean; icon: string }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0.5,
          borderTopColor: '#e5e5e5',
          paddingTop: 10,
          height: 60 + insets.bottom, // ← adapts to device
          paddingBottom: insets.bottom || 8, // ← uses device's safe area
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Add" focused={focused} icon="＋" />
          ),
        }}
      />
      <Tabs.Screen
        name="view"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="View" focused={focused} icon="▦" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  tabIcon: {
    fontSize: 20,
    color: '#aaa',
  },
  tabIconActive: {
    color: '#5b4fcf',
  },
  tabLabel: {
    fontSize: 10,
    color: '#aaa',
  },
  tabLabelActive: {
    color: '#5b4fcf',
    fontWeight: '500',
  },
});