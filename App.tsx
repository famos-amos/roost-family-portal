import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { useAppFonts } from './src/theme/useAppFonts';
import { RootNavigator } from './src/navigation/RootNavigator';

function AppShell() {
  const fontsLoaded = useAppFonts();
  const theme = useTheme();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg }}>
        <ActivityIndicator color={theme.colors.ink} />
      </View>
    );
  }

  return (
    <>
      <RootNavigator />
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
