import { View, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScreenWrapper({ children }) {
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 65;
  
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FF']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, marginBottom: TAB_BAR_HEIGHT }}>
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
} 