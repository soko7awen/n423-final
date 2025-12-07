import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { LexendZetta_400Regular } from '@expo-google-fonts/lexend-zetta';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans';
import * as SplashScreen from 'expo-splash-screen';
import WebTopNav from '../components/WebTopNav';
import { AuthProvider } from '../src/auth/AuthContext';
import { DeviceProvider, useDevice } from './device-context';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    LexendZetta_400Regular,
    NotoSans_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <DeviceProvider>
        <AppContent />
      </DeviceProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { isDesktopWeb } = useDevice();

  return (
    <View style={{ flex: 1, fontFamily: 'NotoSans_400Regular' }}>
      {isDesktopWeb && <WebTopNav />}
      <Stack
        screenOptions={{
          headerShown: !isDesktopWeb,
          headerTitleStyle: {
            fontFamily: "LexendZetta_400Regular",
         },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="about" options={{ title: 'About' }} />
        <Stack.Screen name="contact" options={{ title: 'Contact' }} />
        <Stack.Screen name="signup" options={{ title: 'Create Account' }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="search" options={{ title: 'Search' }} />
      </Stack>
    </View>
  );
}
