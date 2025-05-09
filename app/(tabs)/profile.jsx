import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Animated, Image, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function Profile() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalStories: 0,
    totalPlays: 0,
    totalDuration: '0:00',
    favoriteGenre: 'None',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userDataString = await AsyncStorage.getItem('user');
      if (userDataString) {
        const parsedData = JSON.parse(userDataString);
        setUserData(parsedData);
        
        // Load user's stories to calculate stats
        const storiesString = await AsyncStorage.getItem('uploadedPDFs');
        if (storiesString) {
          const stories = JSON.parse(storiesString);
          calculateStats(stories);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (stories) => {
    const totalStories = stories.length;
    const totalPlays = stories.reduce((sum, story) => sum + (story.metadata?.plays || 0), 0);
    
    // Calculate total duration
    let totalSeconds = 0;
    stories.forEach(story => {
      if (story.duration) {
        const [minutes, seconds] = story.duration.split(':').map(Number);
        totalSeconds += minutes * 60 + seconds;
      }
    });
    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const totalDuration = `${totalMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;

    // Find favorite genre
    const genreCount = {};
    stories.forEach(story => {
      if (story.genre) {
        genreCount[story.genre] = (genreCount[story.genre] || 0) + 1;
      }
    });
    const favoriteGenre = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    setStats({
      totalStories,
      totalPlays,
      totalDuration,
      favoriteGenre,
    });
  };

  const handleCreateStory = () => {
    router.push('/create');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="px-4 pt-6 pb-2">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-2xl font-bold text-white">Profile</Text>
              <Text className="text-sm text-gray-400 mt-1">Your story journey</Text>
            </View>
            <TouchableOpacity
              className="w-30 p-3 h-13 rounded-full border border-red-500 bg-red-500/10 justify-center items-center"
              onPress={handleLogout}
              accessibilityLabel="Log Out"
            >
              <View className="flex-row items-center space-x-1">
                <Text className="text-red-500">LOGOUT</Text>
                <Ionicons name="log-out-outline" size={20} color="red" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Section */}
        <View className="px-4 mb-6">
          <View className="bg-[#282828] rounded-xl p-6 items-center">
            <View className="w-24 h-24 rounded-full bg-[#1F1F1F] justify-center items-center mb-4">
              <Ionicons name="person" size={40} color="#1DB954" />
            </View>
            <Text className="text-3xl font-bold text-white mb-1">
              {userData?.name || 'User'}
            </Text>
            <Text className="text-gray-400 text-xl mb-4">
              {userData?.email || 'user@example.com'}
            </Text>
            <TouchableOpacity 
              className="w-full py-4 rounded-full items-center border border-white/40 bg-black/20"
              onPress={handleCreateStory}
            >
              <Text className="text-white font-semibold text-lg">Create New Story</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        {/* <View className="px-4 mb-6">
          <Text className="text-white text-lg font-semibold mb-4">Your Stats</Text>
          <View className="bg-[#282828] rounded-xl p-4">
            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] bg-[#1F1F1F] rounded-xl p-4 mb-4">
                <Text className="text-gray-400 text-sm mb-1">Total Stories</Text>
                <Text className="text-2xl font-bold text-white">{stats.totalStories}</Text>
              </View>
              <View className="w-[48%] bg-[#1F1F1F] rounded-xl p-4 mb-4">
                <Text className="text-gray-400 text-sm mb-1">Total Plays</Text>
                <Text className="text-2xl font-bold text-white">{stats.totalPlays}</Text>
              </View>
              <View className="w-[48%] bg-[#1F1F1F] rounded-xl p-4">
                <Text className="text-gray-400 text-sm mb-1">Total Duration</Text>
                <Text className="text-2xl font-bold text-white">{stats.totalDuration}</Text>
              </View>
              <View className="w-[48%] bg-[#1F1F1F] rounded-xl p-4">
                <Text className="text-gray-400 text-sm mb-1">Favorite Genre</Text>
                <Text className="text-2xl font-bold text-white">{stats.favoriteGenre}</Text>
              </View>
            </View>
          </View>
        </View> */}

        {/* Settings Section
        <View className="px-4 mb-6">
          <Text className="text-white text-lg font-semibold mb-4">Settings</Text>
          <View className="bg-[#282828] rounded-xl overflow-hidden">
            <TouchableOpacity className="flex-row items-center p-4 border-b border-white/10">
              <Ionicons name="notifications-outline" size={24} color="#FFF" />
              <Text className="text-white ml-4 flex-1">Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center p-4 border-b border-white/10">
              <Ionicons name="language-outline" size={24} color="#FFF" />
              <Text className="text-white ml-4 flex-1">Language</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center p-4">
              <Ionicons name="help-circle-outline" size={24} color="#FFF" />
              <Text className="text-white ml-4 flex-1">Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}