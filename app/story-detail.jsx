import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, PanResponder, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { useAudioPlayer } from './context/AudioPlayerContext';
import tw from 'twrnc';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './context/AuthContext';
import LoginPopup from './components/LoginPopup';
import useLoginPopup from './hooks/useLoginPopup';

export default function StoryDetail() {
  const { storyId, story: storyString, fromMiniPlayer } = useLocalSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { currentStory, isPlaying: contextIsPlaying, loadAndPlayStory, togglePlayPause: contextTogglePlayPause, sound: contextSound } = useAudioPlayer();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userId, setUserId] = useState(null);
  const previousVolume = useRef(1.0);
  const timeUpdateInterval = useRef(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const progressBarWidth = useRef(0);
  const wasPlayingBeforeDrag = useRef(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(fromMiniPlayer === 'true' ? 300 : 0)).current;
  const { user } = useAuth();
  const { showLoginPopup, closeLoginPopup, checkAuth } = useLoginPopup();

  const story = JSON.parse(storyString);
  const isStoryDetail = pathname.includes('/story-detail');

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    if (currentStory?.id === story.id && contextSound) {
      setIsPlaying(contextIsPlaying);
      setupAudioListeners(contextSound);
    }

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, [contextSound]);

  useEffect(() => {
    if (currentStory?.id === story.id) {
      setIsPlaying(contextIsPlaying);
    }
  }, [contextIsPlaying]);

  useEffect(() => {
    if (fromMiniPlayer === 'true') {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }).start();
    }
  }, [fromMiniPlayer]);

  useEffect(() => {
    loadUserData();
    checkFavoriteStatus();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedData = JSON.parse(userData);
        setUserId(parsedData._id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedData = JSON.parse(userData);
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.105:3000';
        const response = await fetch(`${API_URL}/api/stories/${storyId}`);
        const storyData = await response.json();
        setIsFavorited(storyData.favorites?.includes(parsedData._id));
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (!userId) {
        console.error('No user ID found');
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.105:3000';
      const response = await fetch(`${API_URL}/api/stories/${storyId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.isFavorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const setupAudioListeners = (audioSound) => {
    audioSound.getStatusAsync().then(status => {
      if (status.isLoaded) {
        setDuration(status.durationMillis / 1000);
        setCurrentTime(status.positionMillis / 1000);
        animatedValue.setValue(status.positionMillis / status.durationMillis);
      }
    });

    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }

    timeUpdateInterval.current = setInterval(async () => {
      try {
        const status = await audioSound.getStatusAsync();
        if (status.isLoaded && isPlaying && !isDragging) {
          const currentPosition = status.positionMillis;
          const totalDuration = status.durationMillis;
          const progress = currentPosition / totalDuration;

          setCurrentTime(currentPosition / 1000);
          animatedValue.setValue(progress);

          if (currentPosition >= totalDuration) {
            setIsPlaying(false);
            setCurrentTime(0);
            animatedValue.setValue(0);
            contextTogglePlayPause();
          }
        }
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }, 16);

    audioSound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded) {
        if (status.didJustFinish) {
          setIsPlaying(false);
          setCurrentTime(0);
          animatedValue.setValue(0);
          contextTogglePlayPause();
        } else if (status.isPlaying) {
          const progress = status.positionMillis / status.durationMillis;
          setCurrentTime(status.positionMillis / 1000);
          animatedValue.setValue(progress);
        }
      }
    });
  };

  const handlePlayAudio = async () => {
    try {
      loadAndPlayStory(story);
      setIsPlaying(true);
      if (contextSound) {
        setupAudioListeners(contextSound);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const togglePlayPause = async () => {
    if (!contextSound) {
      await handlePlayAudio();
      return;
    }

    if (isPlaying) {
      await contextSound.pauseAsync();
    } else {
      await contextSound.playAsync();
    }
    contextTogglePlayPause();
    Animated.spring(fadeAnim, {
      toValue: isPlaying ? 0.7 : 1,
      useNativeDriver: true,
    }).start();
  };

  const handleVolumeChange = async (value) => {
    try {
      if (contextSound) {
        await contextSound.setVolumeAsync(value);
        setVolume(value);
        if (value > 0) setIsMuted(false);
        if (value === 0) setIsMuted(true);
      }
    } catch (error) {
      console.error('Error changing volume:', error);
    }
  };

  const toggleMute = async () => {
    try {
      if (contextSound) {
        if (isMuted) {
          await contextSound.setVolumeAsync(previousVolume.current);
          setVolume(previousVolume.current);
        } else {
          previousVolume.current = volume;
          await contextSound.setVolumeAsync(0);
          setVolume(0);
        }
        setIsMuted(!isMuted);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const skipBackward = async () => {
    try {
      if (contextSound) {
        const status = await contextSound.getStatusAsync();
        if (status.isLoaded) {
          const newPosition = Math.max(0, status.positionMillis - 10000);
          await contextSound.setPositionAsync(newPosition);
          setCurrentTime(newPosition / 1000);
          animatedValue.setValue(newPosition / status.durationMillis);
        }
      }
    } catch (error) {
      console.error('Error skipping backward:', error);
    }
  };

  const skipForward = async () => {
    try {
      if (contextSound) {
        const status = await contextSound.getStatusAsync();
        if (status.isLoaded) {
          const newPosition = Math.min(status.durationMillis, status.positionMillis + 10000);
          await contextSound.setPositionAsync(newPosition);
          setCurrentTime(newPosition / 1000);
          animatedValue.setValue(newPosition / status.durationMillis);
        }
      }
    } catch (error) {
      console.error('Error skipping forward:', error);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        wasPlayingBeforeDrag.current = isPlaying;
        if (isPlaying) {
          contextTogglePlayPause();
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const progress = Math.max(0, Math.min(1, gestureState.moveX / progressBarWidth.current));
        const newTime = progress * duration;
        setCurrentTime(newTime);
        animatedValue.setValue(progress);
      },
      onPanResponderRelease: async (_, gestureState) => {
        const progress = Math.max(0, Math.min(1, gestureState.moveX / progressBarWidth.current));
        const newTime = progress * duration;
        setCurrentTime(newTime);
        animatedValue.setValue(progress);

        if (contextSound) {
          const status = await contextSound.getStatusAsync();
          if (status.isLoaded) {
            const newPosition = progress * status.durationMillis;
            await contextSound.setPositionAsync(newPosition);
          }
        }

        setIsDragging(false);
        if (wasPlayingBeforeDrag.current) {
          contextTogglePlayPause();
        }
      },
    })
  ).current;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-transparent`}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.9)']}
        style={tw`absolute inset-0`}
      />
      <BlurView intensity={100} tint="dark" style={tw`flex-1 bg-black/30`}>
        <Animated.View
          style={[tw`flex-1`, {
            transform: [{ translateY: slideAnim }],
          }]}
        >
          {/* Header */}
          <View style={tw`flex-row items-center justify-between px-4 py-4`}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/stories')}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={tw`text-white text-lg font-semibold ${Platform.OS === 'ios' ? 'font-helvetica' : 'font-roboto'}`}>
              Story Details
            </Text>
            <TouchableOpacity onPress={toggleFavorite}>
              <Ionicons 
                name={isFavorited ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorited ? "#FF4B4B" : "#FFF"} 
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={tw`flex-1`}
            contentContainerStyle={tw`${isStoryDetail ? (currentStory?.id !== story.id ? 'pb-28' : 'pb-20') : 'pb-4'}`} // Extra padding for MiniPlayer and Play button
          >
            {/* Story Content */}
            <View style={tw`px-4 py-6`}>
              <View style={tw`items-center mb-6`}>
                <View style={tw`w-24 h-24 rounded-xl bg-white/10 justify-center items-center mb-4`}>
                  <Ionicons
                    name={
                      story.mood === 'happy' ? 'sunny' :
                      story.mood === 'sad' ? 'sad' :
                      story.mood === 'angry' ? 'flame' :
                      story.mood === 'joy' ? 'happy' :
                      story.mood === 'surprise' ? 'alert' :
                      story.mood === 'calm' ? 'water' :
                      story.mood === 'mysterious' ? 'moon' : 'flash'
                    }
                    size={40}
                    color="#FFF"
                  />
                </View>
                <Text style={tw`text-2xl font-bold text-white text-center mb-2 ${Platform.OS === 'ios' ? 'font-helvetica' : 'font-roboto'}`}>
                  {story.title}
                </Text>
                <Text style={tw`text-base text-gray-400 text-center`}>{story.author}</Text>
              </View>

              {/* Tags */}
              {story.tags && story.tags.length > 0 && (
                <View style={tw`flex-row flex-wrap gap-2 mb-6`}>
                  {story.tags.map((tag, index) => (
                    <View key={index} style={tw`px-3 py-1 rounded-full bg-white/10`}>
                      <Text style={tw`text-sm text-white`}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Story Info */}
              <View style={tw`bg-white/5 rounded-lg p-4 mb-6`}>
                <View style={tw`flex-row justify-between items-center mb-4`}>
                  <Text style={tw`text-gray-400`}>Duration</Text>
                  <Text style={tw`text-white`}>{story.duration}</Text>
                </View>
                <View style={tw`flex-row justify-between items-center mb-4`}>
                  <Text style={tw`text-gray-400`}>Language</Text>
                  <Text style={tw`text-white`}>{story.language}</Text>
                </View>
                <View style={tw`flex-row justify-between items-center mb-4`}>
                  <Text style={tw`text-gray-400`}>Age Category</Text>
                  <Text style={tw`text-white`}>{story.ageCategory}</Text>
                </View>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-gray-400`}>Genre</Text>
                  <Text style={tw`text-white`}>{story.category}</Text>
                </View>
              </View>

              {/* Description */}
              {story.description && (
                <View style={tw`mb-6`}>
                  <Text style={tw`text-lg font-semibold text-white mb-2`}>Description</Text>
                  <Text style={tw`text-gray-400`}>{story.description}</Text>
                </View>
              )}

              {/* Player Controls */}
              {currentStory?.id === story.id && (
                <View style={tw`mb-6`}>
                  {/* Progress Bar */}
                  <View
                    style={tw`w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-2`}
                    onLayout={(e) => {
                      progressBarWidth.current = e.nativeEvent.layout.width;
                    }}
                    {...panResponder.panHandlers}
                  >
                    <Animated.View
                      style={[tw`h-full bg-[#1DB954] rounded-full`, {
                        width: animatedValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      }]}
                    />
                  </View>

                  {/* Time Display */}
                  <View style={tw`flex-row justify-between mb-4`}>
                    <Text style={tw`text-xs text-gray-400`}>{formatTime(currentTime)}</Text>
                    <Text style={tw`text-xs text-gray-400`}>{formatTime(duration)}</Text>
                  </View>

                  {/* Playback Controls */}
                  <Animated.View style={[tw`flex-row items-center justify-center mb-6`, { opacity: fadeAnim }]}>
                    <TouchableOpacity
                      onPress={skipBackward}
                      style={tw`w-10 h-10 rounded-full bg-white/10 justify-center items-center mx-4`}
                    >
                      <Ionicons name="play-skip-back" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={tw`w-14 h-14 rounded-full bg-[#1DB954] justify-center items-center mx-4`}
                      onPress={togglePlayPause}
                    >
                      <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={28}
                        color="#FFF"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={skipForward}
                      style={tw`w-10 h-10 rounded-full bg-white/10 justify-center items-center mx-4`}
                    >
                      <Ionicons name="play-skip-forward" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Volume Control */}
                  <View style={tw`flex-row items-center px-4`}>
                    <TouchableOpacity
                      onPress={toggleMute}
                      style={tw`w-10 h-10 rounded-full bg-white/10 justify-center items-center mr-3`}
                    >
                      <Ionicons
                        name={isMuted ? "volume-mute" : "volume-high"}
                        size={20}
                        color="#FFF"
                      />
                    </TouchableOpacity>
                    <Slider
                      style={tw`flex-1`}
                      minimumValue={0}
                      maximumValue={1}
                      value={volume}
                      onValueChange={handleVolumeChange}
                      minimumTrackTintColor="#1DB954"
                      maximumTrackTintColor="#666"
                      thumbTintColor="#FFF"
                    />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Play Button (if not currently playing this story) */}
          {currentStory?.id !== story.id && (
            <View style={tw`px-4 py-4 bg-black/20 absolute left-0 right-0 ${currentStory ? 'bottom-[80px]' : 'bottom-0'}`}>
              <TouchableOpacity
                style={tw`w-full h-12 bg-[#1DB954] rounded-full justify-center items-center flex-row`}
                onPress={handlePlayAudio}
              >
                <Ionicons name="play" size={20} color="#FFF" />
                <Text style={tw`text-white font-semibold ml-2 text-base`}>Play Story</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </BlurView>
    </SafeAreaView>
  );
}