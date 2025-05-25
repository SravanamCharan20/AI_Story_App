import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Animated, Image, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import LoginPopup from '../components/LoginPopup';
import useLoginPopup from '../hooks/useLoginPopup';
import { useAudioPlayer } from '../context/AudioPlayerContext';

const { width } = Dimensions.get('window');

export default function Profile() {
  const router = useRouter();
  const { user, continueAsGuest, forceSignIn } = useAuth();
  const { showLoginPopup, closeLoginPopup } = useLoginPopup();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalStories: 0,
    totalPlays: 0,
    totalDuration: '0:00',
    favoriteGenre: 'None',
    favoriteStories: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteStories, setFavoriteStories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const { currentStory, isPlaying: audioPlayerIsPlaying, togglePlayPause, loadAndPlayStory } = useAudioPlayer();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
    checkGuestStatus();
    loadUserData();
  }, []);

  const checkGuestStatus = async () => {
    try {
      const guestStatus = await AsyncStorage.getItem('isGuest');
      setIsGuest(guestStatus === 'true');
    } catch (error) {
      console.error('Error checking guest status:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userDataString = await AsyncStorage.getItem('user');
      if (userDataString) {
        const parsedData = JSON.parse(userDataString);
        setUserData(parsedData);
        
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.105:3000';
        
        // Load user's stories
        const storiesResponse = await fetch(`${API_URL}/api/stories/user/${parsedData._id}`);
        if (storiesResponse.ok) {
          const stories = await storiesResponse.json();
          calculateStats(stories);
        }

        // Load favorite stories with proper transformation
        const favoritesResponse = await fetch(`${API_URL}/api/stories/favorites/${parsedData._id}`);
        if (favoritesResponse.ok) {
          const favorites = await favoritesResponse.json();
          const transformedFavorites = favorites.map(story => ({
            _id: story._id,
            id: story._id,
            title: story.title,
            author: story.narrator || story.author,
            mood: story.mood,
            category: story.genre,
            duration: story.duration || '0:00',
            language: story.language,
            rating: story.metadata?.rating || 0,
            plays: story.metadata?.plays || 0,
            createdAt: story.createdAt,
            audioUrl: story.audioUrl,
            storyUrl: story.storyUrl,
            tags: story.tags || [],
            ageCategory: story.ageCategory,
            isFavorited: true
          }));
          setFavoriteStories(transformedFavorites);
          setStats(prev => ({ ...prev, favoriteStories: transformedFavorites.length }));
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
      favoriteStories: stats.favoriteStories,
    });
  };

  const handleLogin = () => {
    try {
      forceSignIn();
    } catch (error) {
      console.error('Error navigating to sign in:', error);
    }
  };

  const handleSignup = () => {
    try {
      router.replace('/auth/signUp');
    } catch (error) {
      console.error('Error navigating to sign up:', error);
    }
  };

  const handleContinueAsGuest = async () => {
    try {
      await continueAsGuest();
      setIsGuest(true);
    } catch (error) {
      console.error('Error continuing as guest:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      setIsGuest(false);
      setUserData(null);
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleViewStory = (story) => {
    router.push({
      pathname: '/story-detail',
      params: { 
        storyId: story._id,
        story: JSON.stringify(story)
      }
    });
  };

  const handleRemoveFavorite = async (storyId) => {
    try {
      if (!userData?._id) return;

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.105:3000';
      const response = await fetch(`${API_URL}/api/stories/${storyId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userData._id }),
      });

      if (response.ok) {
        // Refresh both favorite stories and stats
        await loadUserData();
        
        // Update AsyncStorage to trigger refresh in other components
        const currentFavorites = await AsyncStorage.getItem('favoriteStories');
        if (currentFavorites) {
          const favorites = JSON.parse(currentFavorites);
          const updatedFavorites = favorites.filter(id => id !== storyId);
          await AsyncStorage.setItem('favoriteStories', JSON.stringify(updatedFavorites));
        }
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePlayAudio = async (story) => {
    try {
      if (currentStory?.id === story.id) {
        togglePlayPause();
      } else {
        await loadAndPlayStory(story);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // Show welcome screen if no user and not guest
  if (!user && !isGuest) {
    return (
      <SafeAreaView style={tw`flex-1 bg-black`}>
        <ScrollView 
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <LinearGradient
            colors={['black', 'black']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`flex-1`}
          >
            <BlurView intensity={20} style={tw`flex-1`}>
              <Animated.View
                style={[
                  tw`flex-1 px-5 pt-16`,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {/* Header Section */}
                <View style={tw`items-center mb-10`}>
                  <View style={tw`w-32 h-32 rounded-full bg-white/10 justify-center items-center mb-6`}>
                    <Ionicons name="person" size={60} color="white" />
                  </View>
                  <Text style={tw`text-4xl font-bold text-white mb-2 text-center`}>
                    Welcome to StoryTime
                  </Text>
                  <Text style={tw`text-lg text-white/80 text-center`}>
                    Join our community of storytellers
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={tw`space-y-4 mb-10`}>
                  <TouchableOpacity
                    onPress={handleLogin}
                    style={tw`bg-white rounded-2xl py-4 items-center shadow-lg`}
                  >
                    <Text style={tw`text-black font-bold text-lg`}>Sign In</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSignup}
                    style={tw`bg-[#1DB954] rounded-2xl py-4 items-center shadow-lg`}
                  >
                    <Text style={tw`text-white font-bold text-lg`}>Create Account</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleContinueAsGuest}
                    style={tw`bg-white/10 rounded-2xl py-4 items-center`}
                  >
                    <Text style={tw`text-white font-semibold text-lg`}>Continue as Guest</Text>
                  </TouchableOpacity>
                </View>

                {/* Features Section */}
                <View style={tw`mb-10`}>
                  <Text style={tw`text-2xl font-bold text-white mb-6 text-center`}>
                    Premium Features
                  </Text>
                  <View style={tw`space-y-6`}>
                    {[
                      {
                        icon: 'bookmark',
                        title: 'Save Your Favorites',
                        description: 'Keep track of your favorite stories and continue reading later',
                      },
                      {
                        icon: 'create',
                        title: 'Create Stories',
                        description: 'Share your own stories with our growing community',
                      },
                      {
                        icon: 'analytics',
                        title: 'Track Progress',
                        description: 'Monitor your reading habits and achievements',
                      },
                    ].map((feature, index) => (
                      <View
                        key={index}
                        style={tw`bg-white/5 rounded-2xl p-4 flex-row items-center`}
                      >
                        <View style={tw`w-12 h-12 rounded-full bg-[#1DB954]/20 justify-center items-center mr-4`}>
                          <Ionicons name={feature.icon} size={24} color="#1DB954" />
                        </View>
                        <View style={tw`flex-1`}>
                          <Text style={tw`text-white font-semibold text-lg mb-1`}>
                            {feature.title}
                          </Text>
                          <Text style={tw`text-white/70`}>
                            {feature.description}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Community Stats */}
                <View style={tw`bg-white/5 rounded-2xl p-6 mb-10`}>
                  <Text style={tw`text-2xl font-bold text-white mb-4 text-center`}>
                    Join Our Community
                  </Text>
                  <View style={tw`flex-row justify-around`}>
                    {[
                      { value: '10K+', label: 'Stories' },
                      { value: '5K+', label: 'Writers' },
                      { value: '50K+', label: 'Readers' },
                    ].map((stat, index) => (
                      <View key={index} style={tw`items-center`}>
                        <Text style={tw`text-[#1DB954] font-bold text-2xl`}>
                          {stat.value}
                        </Text>
                        <Text style={tw`text-white/70`}>
                          {stat.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>
            </BlurView>
          </LinearGradient>
        </ScrollView>
        <LoginPopup visible={showLoginPopup} onClose={closeLoginPopup} />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-black items-center justify-center`}>
        <ActivityIndicator size="large" color="#1DB954" />
      </SafeAreaView>
    );
  }

  // Show guest profile
  if (isGuest) {
    return (
      <SafeAreaView style={tw`flex-1 bg-black`}>
        <ScrollView 
          style={tw`flex-1`}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor="#FFF"
            />
          }
        >
          <LinearGradient
            colors={['#1DB954', '#191414']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`flex-1`}
          >
            <BlurView intensity={20} style={tw`flex-1`}>
              <View style={tw`px-5 pt-6 pb-4`}>
                {/* Guest Profile Header */}
                <View style={tw`items-center mb-6`}>
                  <View style={tw`w-24 h-24 rounded-full bg-white/10 justify-center items-center mb-4`}>
                    <Ionicons name="person" size={48} color="white" />
                  </View>
                  <Text style={tw`text-2xl font-bold text-white mb-1`}>Guest User</Text>
                  <Text style={tw`text-gray-400`}>Guest Mode</Text>
                </View>

                {/* Action Buttons */}
                <View style={tw`space-y-4 mb-6`}>
                  <TouchableOpacity
                    onPress={handleLogin}
                    style={tw`bg-[#1DB954] rounded-full py-3 items-center`}
                  >
                    <Text style={tw`text-white font-semibold`}>Sign In to Unlock Features</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleSignup}
                    style={tw`bg-white/10 rounded-full py-3 items-center`}
                  >
                    <Text style={tw`text-white font-semibold`}>Create New Account</Text>
                  </TouchableOpacity>
                </View>

                {/* Features Preview */}
                <View style={tw`mb-6`}>
                  <Text style={tw`text-xl font-bold text-white mb-4`}>Unlock Premium Features</Text>
                  <View style={tw`space-y-4`}>
                    {[
                      {
                        icon: 'create',
                        title: 'Create Stories',
                        description: 'Share your own stories with our community',
                      },
                      {
                        icon: 'bookmark',
                        title: 'Save Favorites',
                        description: 'Keep track of your favorite stories',
                      },
                      {
                        icon: 'analytics',
                        title: 'Track Progress',
                        description: 'Monitor your reading habits',
                      },
                    ].map((feature, index) => (
                      <View
                        key={index}
                        style={tw`bg-white/5 rounded-2xl p-4 flex-row items-center`}
                      >
                        <View style={tw`w-12 h-12 rounded-full bg-[#1DB954]/20 justify-center items-center mr-4`}>
                          <Ionicons name={feature.icon} size={24} color="#1DB954" />
                        </View>
                        <View style={tw`flex-1`}>
                          <Text style={tw`text-white font-semibold text-lg mb-1`}>
                            {feature.title}
                          </Text>
                          <Text style={tw`text-white/70`}>
                            {feature.description}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </BlurView>
          </LinearGradient>
        </ScrollView>
        <LoginPopup visible={showLoginPopup} onClose={closeLoginPopup} />
      </SafeAreaView>
    );
  }

  // Show authenticated user profile
  return (
    <SafeAreaView style={tw`flex-1 bg-black`}>
      <ScrollView 
        style={tw`flex-1`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFF"
          />
        }
      >
        <LinearGradient
          colors={['', '#191414']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`flex-1`}
        >
          <BlurView intensity={20} style={tw`flex-1`}>
            <View style={tw`px-5 pt-6 pb-4`}>
              {/* Profile Header */}
              <View style={tw`items-center mb-6`}>
                <View style={tw`w-24 h-24 rounded-full bg-white/10 justify-center items-center mb-4`}>
                  <Ionicons name="person" size={48} color="white" />
                </View>
                <Text style={tw`text-2xl font-bold text-white mb-1`}>
                  {userData?.name || 'User'}
                </Text>
                <Text style={tw`text-gray-400 mb-4`}>{userData?.email}</Text>
                
                {userData ? (
                  <TouchableOpacity
                    onPress={handleLogout}
                    style={tw`bg-white/10 rounded-full px-6 py-2 flex-row items-center`}
                  >
                    <Ionicons name="log-out-outline" size={20} color="#FF4B4B" style={tw`mr-2`} />
                    <Text style={tw`text-[#FF4B4B] font-semibold`}>Logout</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={tw`flex-row gap-3`}>
                    <TouchableOpacity
                      onPress={handleLogin}
                      style={tw`bg-[#1DB954] rounded-full px-6 py-2 flex-row items-center`}
                    >
                      <Ionicons name="log-in-outline" size={20} color="white" style={tw`mr-2`} />
                      <Text style={tw`text-white font-semibold`}>Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSignup}
                      style={tw`bg-white/10 rounded-full px-6 py-2 flex-row items-center`}
                    >
                      <Ionicons name="person-add-outline" size={20} color="white" style={tw`mr-2`} />
                      <Text style={tw`text-white font-semibold`}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Stats Cards */}
              <View style={tw`flex-row flex-wrap justify-between mb-6`}>
                <View style={tw`w-[48%] bg-white/5 rounded-xl p-4 mb-4`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <Ionicons name="book" size={20} color="#1DB954" />
                    <Text style={tw`text-gray-400 text-sm ml-2`}>Total Stories</Text>
                  </View>
                  <Text style={tw`text-white text-xl font-semibold`}>{stats.totalStories}</Text>
                </View>
                <View style={tw`w-[48%] bg-white/5 rounded-xl p-4 mb-4`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <Ionicons name="heart" size={20} color="#1DB954" />
                    <Text style={tw`text-gray-400 text-sm ml-2`}>Favorite Stories</Text>
                  </View>
                  <Text style={tw`text-white text-xl font-semibold`}>{stats.favoriteStories}</Text>
                </View>
              </View>

              {/* Favorite Stories Section */}
              <View style={tw`mb-6`}>
                <View style={tw`flex-row items-center mb-4`}>
                  <Ionicons name="heart" size={24} color="#1DB954" style={tw`mr-2`} />
                  <Text style={tw`text-xl font-bold text-white`}>Favorite Stories</Text>
                </View>
                
                {favoriteStories.length === 0 ? (
                  <View style={tw`bg-white/5 rounded-2xl p-6 items-center justify-center`}>
                    <Ionicons name="heart-outline" size={48} color="#666" style={tw`mb-3`} />
                    <Text style={tw`text-gray-400 text-center`}>No favorite stories yet</Text>
                    <Text style={tw`text-gray-500 text-sm text-center mt-1`}>Your favorite stories will appear here</Text>
                  </View>
                ) : (
                  <View style={tw`space-y-2`}>
                    {favoriteStories.map((story) => (
                      <TouchableOpacity
                        key={story._id}
                        onPress={() => handleViewStory(story)}
                        style={tw`bg-white/5 rounded-lg p-4 flex-row items-center`}
                      >
                        <View style={tw`w-12 h-12 rounded-md bg-white/10 justify-center items-center mr-3`}>
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
                            size={24} 
                            color="#FFF" 
                          />
                        </View>
                        <View style={tw`flex-1`}>
                          <Text style={tw`text-base font-semibold text-white mb-1`} numberOfLines={1}>
                            {story.title}
                          </Text>
                          <Text style={tw`text-sm text-gray-400`} numberOfLines={1}>
                            {story.author || 'Unknown Author'} • {story.duration || '0:00'}
                          </Text>
                          <View style={tw`flex-row items-center mt-1`}>
                            <Text style={tw`text-xs text-gray-500 mr-2`}>
                              {story.category} • {story.language}
                            </Text>
                            <View style={tw`flex-row items-center`}>
                              <Ionicons name="star" size={12} color="#1DB954" />
                              <Text style={tw`text-xs text-gray-400 ml-1`}>{story.rating || '0.0'}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={tw`flex-row items-center gap-3`}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleRemoveFavorite(story._id);
                            }}
                            style={tw`p-2`}
                          >
                            <Ionicons name="heart" size={20} color="#1DB954" />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </BlurView>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}