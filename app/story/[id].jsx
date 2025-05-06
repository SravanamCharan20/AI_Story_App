import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { fetch } from 'react-native-fetch-api';

export default function StoryDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [story, setStory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const API_URL = 'http://192.168.0.109:3000';
        const response = await fetch(`${API_URL}/api/stories/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch story');
        }
        const data = await response.json();
        setStory(data);
      } catch (error) {
        console.error('Error fetching story:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [id]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handlePlayAudio = async () => {
    try {
      if (!story?.audioUrl) {
        throw new Error('No audio URL available');
      }

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: story.audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          await newSound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setError(error.message);
    }
  };

  const togglePlayPause = async () => {
    try {
      if (!sound) {
        await handlePlayAudio();
        return;
      }

      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      setError(error.message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#FFF" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-center px-4">{error}</Text>
        <TouchableOpacity 
          className="mt-4 px-4 py-2 bg-white/10 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!story) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-white">Story not found</Text>
        <TouchableOpacity 
          className="mt-4 px-4 py-2 bg-white/10 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity onPress={() => router.back()}>
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
              <Text className="text-base text-gray-400 text-center">{story.narrator}</Text>
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
                <Text className="text-white">{story.duration || '0:00'}</Text>
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
                <Text className="text-white">{story.genre}</Text>
              </View>
            </View>

            {/* Description */}
            {story.metadata?.description && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-white mb-2">Description</Text>
                <Text className="text-gray-400">{story.metadata.description}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Play Button */}
        {story.audioUrl && (
          <View className="px-4 py-4">
            <TouchableOpacity
              className="w-full h-14 bg-[#1DB954] rounded-full justify-center items-center flex-row"
              onPress={togglePlayPause}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={24}
                color="#FFF"
              />
              <Text className="text-white font-semibold ml-2">
                {isPlaying ? "Pause" : "Play"} Story
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
} 