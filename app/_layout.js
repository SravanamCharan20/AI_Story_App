import { Stack, usePathname } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthProvider from './context/AuthContext';
import AudioPlayerProvider from './context/AudioPlayerContext';
import MiniPlayer from './components/MiniPlayer';
import { View } from 'react-native';
import tw from 'twrnc';

function RootLayoutNav() {
  const pathname = usePathname();
  const isStoryDetail = pathname.includes('/story-detail');

  return (
    <View style={tw`flex-1`}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <View
        style={tw`absolute left-0 right-0 z-[999] ${
          isStoryDetail ? 'bottom-0' : 'bottom-[49px]'
        }`}
      >
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