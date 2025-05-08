import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Animated, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { useAudioPlayer } from './context/AudioPlayerContext';
import MiniPlayer from './components/MiniPlayer';

export default function StoryDetail() {
  const { storyId, story: storyString } = useLocalSearchParams();
  const router = useRouter();
  const { currentStory, isPlaying: contextIsPlaying, loadAndPlayStory, togglePlayPause: contextTogglePlayPause, sound: contextSound } = useAudioPlayer();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const previousVolume = useRef(1.0);
  const timeUpdateInterval = useRef(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const progressBarWidth = useRef(0);
  const wasPlayingBeforeDrag = useRef(false);

  // Parse the story data
  const story = JSON.parse(storyString);

  useEffect(() => {
    // Initialize audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    // Set initial state based on context
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

  // Update local playing state when context changes
  useEffect(() => {
    if (currentStory?.id === story.id) {
      setIsPlaying(contextIsPlaying);
    }
  }, [contextIsPlaying]);

  const setupAudioListeners = (audioSound) => {
    // Get initial duration and position
    audioSound.getStatusAsync().then(status => {
      if (status.isLoaded) {
        setDuration(status.durationMillis / 1000);
        setCurrentTime(status.positionMillis / 1000);
        animatedValue.setValue(status.positionMillis / status.durationMillis);
      }
    });

    // Set up progress tracking with more frequent updates
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

          // Check if audio has completed
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

    // Set up playback status listener
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
      
      // Ensure we set up listeners after loading the story
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
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity onPress={() => router.push('/(tabs)/stories')}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Story Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1">
          {/* Story Content */}
          <View className="px-4 py-6">
            <View className="items-center mb-6">
              <View className="w-32 h-32 rounded-lg bg-white/10 justify-center items-center mb-4">
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
                  size={48} 
                  color="#FFF" 
                />
              </View>
              <Text className="text-2xl font-bold text-white text-center mb-2">{story.title}</Text>
              <Text className="text-base text-gray-400 text-center">{story.author}</Text>
            </View>

            {/* Tags */}
            {story.tags && story.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-6">
                {story.tags.map((tag, index) => (
                  <View key={index} className="px-3 py-1 rounded-full bg-white/10">
                    <Text className="text-sm text-white">{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Story Info */}
            <View className="bg-white/5 rounded-lg p-4 mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-400">Duration</Text>
                <Text className="text-white">{story.duration}</Text>
              </View>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-400">Language</Text>
                <Text className="text-white">{story.language}</Text>
              </View>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-400">Age Category</Text>
                <Text className="text-white">{story.ageCategory}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-400">Genre</Text>
                <Text className="text-white">{story.category}</Text>
              </View>
            </View>

            {/* Description */}
            {story.description && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-white mb-2">Description</Text>
                <Text className="text-gray-400">{story.description}</Text>
              </View>
            )}

            {/* Player Controls */}
            {currentStory?.id === story.id && (
              <View className="mb-6">
                {/* Progress Bar */}
                <View 
                  className="w-full h-1 bg-white/20 rounded-full overflow-hidden mb-2"
                  onLayout={(e) => {
                    progressBarWidth.current = e.nativeEvent.layout.width;
                  }}
                  {...panResponder.panHandlers}
                >
                  <Animated.View
                    className="h-full bg-[#1DB954] rounded-full"
                    style={{
                      width: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    }}
                  />
                </View>

                {/* Time Display */}
                <View className="flex-row justify-between mb-4">
                  <Text className="text-xs text-gray-400">{formatTime(currentTime)}</Text>
                  <Text className="text-xs text-gray-400">{formatTime(duration)}</Text>
                </View>

                {/* Playback Controls */}
                <View className="flex-row items-center justify-between mb-6">
                  <TouchableOpacity 
                    onPress={skipBackward}
                    className="w-12 h-12 rounded-full bg-white/10 justify-center items-center"
                  >
                    <Ionicons name="play-skip-back" size={24} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="w-16 h-16 rounded-full bg-[#1DB954] justify-center items-center"
                    onPress={togglePlayPause}
                  >
                    <Ionicons
                      name={isPlaying ? "pause" : "play"}
                      size={32}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={skipForward}
                    className="w-12 h-12 rounded-full bg-white/10 justify-center items-center"
                  >
                    <Ionicons name="play-skip-forward" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>

                {/* Volume Control */}
                <View className="flex-row items-center">
                  <TouchableOpacity 
                    onPress={toggleMute} 
                    className="w-12 h-12 rounded-full bg-white/10 justify-center items-center mr-4"
                  >
                    <Ionicons
                      name={isMuted ? "volume-mute" : "volume-high"}
                      size={24}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                  <Slider
                    style={{ flex: 1 }}
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
          <View className="px-4 py-4">
            <TouchableOpacity
              className="w-full h-14 bg-[#1DB954] rounded-full justify-center items-center flex-row"
              onPress={handlePlayAudio}
            >
              <Ionicons name="play" size={24} color="#FFF" />
              <Text className="text-white font-semibold ml-2">Play Story</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
} 