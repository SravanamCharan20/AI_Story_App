import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthProvider from './context/AuthContext';
import AudioPlayerProvider from './context/AudioPlayerContext';
import MiniPlayer from './components/MiniPlayer';
import { View } from 'react-native';

function RootLayoutNav() {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <View style={{ position: 'absolute', bottom: 49, left: 0, right: 0, zIndex: 999 }}>
        <MiniPlayer />
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AudioPlayerProvider>
          <RootLayoutNav />
        </AudioPlayerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
} 