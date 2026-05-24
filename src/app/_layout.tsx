import { useEffect, useState } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { initDatabase } from '@/database/db';
import '@/global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
        setDbReady(true);
        await SplashScreen.hideAsync(); 
      } catch (e) {
        console.error('DB Init Error:', e);
      }
    }
    prepare();
  }, []);

  if (!dbReady) return null;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}