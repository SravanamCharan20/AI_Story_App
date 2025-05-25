import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Dimensions, Animated, Modal, ActivityIndicator, TextInput, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenWrapper from '../components/ScreenWrapper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { PanResponder, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import tw from 'twrnc';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import LoginPopup from '../components/LoginPopup';
import useLoginPopup from '../hooks/useLoginPopup';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { showLoginPopup, closeLoginPopup, checkAuth } = useLoginPopup();
  const [userData, setUserData] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('user');
      if (userDataString) {
        const parsedData = JSON.parse(userDataString);
        setUserData(parsedData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleCreateStory = () => {
    if (checkAuth()) {
      router.push('/create-story');
    }
  };

  const handleStoryPress = (story) => {
    if (checkAuth()) {
      router.push({
        pathname: '/story-detail',
        params: { story: JSON.stringify(story) }
      });
    }
  };

  const handleLogin = () => {
    closeLoginPopup();
    router.replace('/auth/signIn');
  };

  const handleSignup = () => {
    closeLoginPopup();
    router.replace('/auth/signUp');
  };

  const handleContinueBrowsing = () => {
    closeLoginPopup();
  };

  const LoginPrompt = () => (
    <Modal
      visible={showLoginPopup}
      transparent
      animationType="fade"
      onRequestClose={closeLoginPopup}
    >
      <BlurView intensity={100} tint="dark" style={tw`flex-1 bg-black/30`}>
        <View className="flex-1 justify-center items-center px-4">
          <View className="bg-white/10 rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-2xl font-bold text-white text-center mb-2">
              Sign in to Create Stories
            </Text>
            <Text className="text-gray-400 text-center mb-6">
              Create an account to start sharing your stories with the world
            </Text>

            <View className="space-y-4">
              <TouchableOpacity
                onPress={handleLogin}
                className="w-full bg-gradient-to-r from-[#1DB954] to-[#1ed760] rounded-full py-4 items-center"
              >
                <Text className="text-white font-semibold text-lg">Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSignup}
                className="w-full bg-white/10 rounded-full py-4 items-center"
              >
                <Text className="text-white font-semibold text-lg">Create Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleContinueBrowsing}
                className="w-full py-4 items-center"
              >
                <Text className="text-gray-400">Continue browsing</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );

  const featuredStories = [
    { id: 1, title: "The Magic Forest", age: "4-6", duration: "5 min", color: ['#FFB7B7', '#FF8C8C'] },
    { id: 2, title: "Space Adventure", age: "5-7", duration: "8 min", color: ['#B7D4FF', '#8CB4FF'] },
    { id: 3, title: "Dragon's Tale", age: "6-8", duration: "10 min", color: ['#B7FFD8', '#8CFFC0'] },
  ];

  const categories = [
    { id: 1, title: "Bedtime Stories", icon: "moon" },
    { id: 2, title: "Adventure", icon: "compass" },
    { id: 3, title: "Animals", icon: "paw" },
    { id: 4, title: "Fantasy", icon: "color-wand" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-black ">
            <ScrollView className="flex-1 px-4">
              <View className='flex-row justify-between items-center'>
                <Text className='text-white text-2xl font-bold'>Home</Text>
                <TouchableOpacity className='bg-white/10 rounded-full p-2'>
                  <Ionicons name="search" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </ScrollView>
      <LoginPrompt />
    </SafeAreaView>
  );
}
