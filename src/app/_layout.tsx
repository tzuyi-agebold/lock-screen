import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FloatingIntention } from '@/features/floating-pill/FloatingIntention';
import { SessionEffects } from '@/features/session/SessionEffects';
import { useHydrated } from '@/state/useHydrated';
import { Button } from '@/ui/components';
import { useTheme } from '@/ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** In a desktop browser, preview the app inside an iPhone-sized column. */
const WEB_PREVIEW_MAX_WIDTH = 430;

export default function RootLayout() {
  const theme = useTheme();
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  if (!hydrated) return null;

  const navigationTheme = {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme : DefaultTheme).colors,
      primary: theme.colors.label,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.label,
      border: theme.colors.border,
    },
  };

  return (
    <GestureHandlerRootView
      style={[styles.root, { backgroundColor: theme.dark ? '#0B0B0B' : '#EDEDED' }]}
    >
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <View style={[styles.device, { backgroundColor: theme.colors.background }]}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen
                name="onboarding"
                options={{ gestureEnabled: false, animation: 'fade' }}
              />
              <Stack.Screen
                name="settings"
                options={({ navigation }) => ({
                  presentation: 'modal',
                  headerShown: true,
                  title: 'Settings',
                  headerShadowVisible: false,
                  headerStyle: { backgroundColor: theme.colors.background },
                  headerTitleStyle: { fontWeight: '600' },
                  headerRight: () => (
                    <Button
                      title="Done"
                      variant="quiet"
                      size="small"
                      onPress={() => navigation.goBack()}
                    />
                  ),
                })}
              />
              <Stack.Screen
                name="times-up"
                options={{
                  presentation: 'fullScreenModal',
                  gestureEnabled: false,
                  animation: 'fade',
                }}
              />
            </Stack>
            <FloatingIntention />
            <SessionEffects />
          </View>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  device: {
    flex: 1,
    width: '100%',
    ...Platform.select({
      web: {
        maxWidth: WEB_PREVIEW_MAX_WIDTH,
        alignSelf: 'center',
        overflow: 'hidden',
        boxShadow: '0 0 60px rgba(0, 0, 0, 0.18)',
      },
      default: {},
    }),
  },
});
