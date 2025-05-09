import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import tw from 'twrnc';

export default function MiniPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentStory, isPlaying, togglePlayPause, closePlayer, sound } = useAudioPlayer();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let statusListener;
    if (sound) {
      statusListener = sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          togglePlayPause();
        }
      });
    }
    return () => {
      if (statusListener) {
        statusListener.remove();
      }
    };
  }, [sound]);

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: currentStory ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [currentStory]);

  if (!currentStory) return null;

  const handlePress = () => {
    if (!pathname.includes('/story-detail')) {
      router.push({
        pathname: '/story-detail',
        params: {
          storyId: currentStory.id,
          story: JSON.stringify(currentStory)
        }
      });
    }
  };

  return (
    <Animated.View style={[tw`absolute bottom-0 left-1 right-1 rounded-t-3xl border border-white/40 overflow-hidden shadow-xl`, {
        transform: [{
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 0]
          })
        }],
        opacity: animatedValue
      }]}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.5)']}
        style={tw`pb-[${Platform.OS === 'ios' ? 6 : 1}]`}
      >
        <BlurView intensity={100} tint="dark" style={tw`flex-1 bg-black/30`}>
          <TouchableOpacity 
            style={tw`flex-row items-center justify-between px-4 py-3 active:opacity-70`}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <View style={tw`flex-1 mr-4`}>
              <Text style={tw`text-white text-base font-semibold ${Platform.OS === 'ios' ? 'font-helvetica' : 'font-roboto'} mb-1`} numberOfLines={1}>
                {currentStory.title}
              </Text>
              <Text style={tw`text-gray-400 text-xs font-normal opacity-90`} numberOfLines={1}>
                {currentStory.author}
              </Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <TouchableOpacity 
                onPress={togglePlayPause}
                style={tw`w-10 h-10 rounded-full bg-green-500 justify-center items-center mr-3 shadow-md`}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={24}
                  color="#FFF"
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={closePlayer}
                style={tw`w-8 h-8 rounded-full bg-white/20 justify-center items-center`}
              >
                <Ionicons name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );
}