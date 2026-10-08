import './global.css';

import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from './src/components/theme-provider';
import { MotionProvider } from './src/components/motion/motion-provider';

import { AntiLateApp } from './src/AntiLateApp';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) {
    return <View className="flex-1 bg-paper" />;
  }

  return (
    <MotionProvider>
      <AntiLateApp />
    </MotionProvider>
  );
}