import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Animated, TextInput, Switch, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

const MOODS = ['happy', 'sad', 'angry', 'joy', 'surprise', 'calm', 'mysterious', 'exciting'];
const CATEGORIES = ['Fantasy', 'Drama', 'Adventure', 'Mystery', 'Romance', 'Sci-Fi', 'Horror', 'Comedy'];
const LANGUAGES = ['Telugu', 'English', 'Hindi', 'Tamil', 'Kannada', 'Malayalam'];
const AGE_CATEGORIES = ['Kids', 'Teens', 'Adults', 'All Ages'];

// Custom Picker Component to handle platform differences
const CustomPicker = ({ selectedValue, onValueChange, items, placeholder }) => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={styles.picker}
        >
          {placeholder && <Picker.Item label={placeholder} value="" color="#666" />}
          {items.map((item) => (
            <Picker.Item
              key={item}
              label={item}
              value={item}
              color="black"
            />
          ))}
        </Picker>
      </View>
    );
  }

  return (
    <View className="bg-[#1F1F1F] rounded-lg overflow-hidden">
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={{ color: 'white' }}
        dropdownIconColor="white"
        mode="dropdown"
      >
        {placeholder && <Picker.Item label={placeholder} value="" color="#666" />}
        {items.map((item) => (
          <Picker.Item 
            key={item} 
            label={item} 
            value={item} 
            color="white"
          />
        ))}
      </Picker>
    </View>
  );
};

export default function Profile() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [uploadedPdfs, setUploadedPdfs] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [storyFile, setStoryFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    narrator: '',
    language: 'Telugu',
    ageCategory: 'All Ages',
    genre: '',
    mood: '',
    tags: '',
    hasPermission: false
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    loadUploadedPDFs();
  }, []);

  const loadUploadedPDFs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const savedPDFs = await AsyncStorage.getItem('uploadedPDFs');
      if (savedPDFs) {
        const parsedPDFs = JSON.parse(savedPDFs);
        setUploadedPdfs(parsedPDFs);
      }
    } catch (error) {
      console.log('Error loading PDFs:', error);
      setError('Failed to load previous stories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioUpload = async () => {
    try {
      setError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        setAudioFile({
          name: result.assets[0].name,
          uri: result.assets[0].uri,
          size: (result.assets[0].size / 1024 / 1024).toFixed(2) + ' MB',
        });
      }
    } catch (error) {
      console.log('Error picking audio:', error);
      setError('Failed to upload audio file');
    }
  };

  const handleStoryUpload = async () => {
    try {
      setError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        setStoryFile({
          name: result.assets[0].name,
          uri: result.assets[0].uri,
          size: (result.assets[0].size / 1024 / 1024).toFixed(2) + ' MB',
          type: result.assets[0].mimeType,
        });
      }
    } catch (error) {
      console.log('Error picking story:', error);
      setError('Failed to upload story file');
    }
  };

  const handleViewStory = (story) => {
    try {
      router.push({
        pathname: '/(tabs)/stories',
        params: { storyId: story.id }
      });
    } catch (error) {
      console.log('Error navigating to story:', error);
      setError('Failed to open story');
    }
  };

  const handleGenerateStory = async () => {
    if (!audioFile || !storyFile || !formData.title || !formData.hasPermission) {
      console.log('Validation failed:', {
        audioFile: !!audioFile,
        storyFile: !!storyFile,
        title: !!formData.title,
        hasPermission: formData.hasPermission
      });
      setError('Please fill in all required fields and upload both files');
      return;
    }

    try {
      console.log('Starting story generation process...');
      setIsLoading(true);
      setError(null);

      // Get current user ID from AsyncStorage
      console.log('Fetching user data from AsyncStorage...');
      const userData = await AsyncStorage.getItem('user');
      console.log('User data from AsyncStorage:', userData);

      if (!userData) {
        console.error('No user data found in AsyncStorage');
        throw new Error('User not authenticated');
      }

      let userId;
      try {
        console.log('Parsing user data...');
        const parsedUserData = JSON.parse(userData);
        userId = parsedUserData._id;
        console.log('Parsed user ID:', userId);
        
        if (!userId) {
          console.error('Invalid user data: No user ID found');
          throw new Error('Invalid user data');
        }
      } catch (parseError) {
        console.error('Error parsing user data:', parseError);
        throw new Error('Invalid user data format');
      }

      // Validate file existence
      console.log('Validating files...');
      const audioFileInfo = await FileSystem.getInfoAsync(audioFile.uri);
      const storyFileInfo = await FileSystem.getInfoAsync(storyFile.uri);
      console.log('File validation results:', {
        audio: { exists: audioFileInfo.exists, size: audioFileInfo.size },
        story: { exists: storyFileInfo.exists, size: storyFileInfo.size }
      });

      if (!audioFileInfo.exists || !storyFileInfo.exists) {
        console.error('Files not accessible:', {
          audio: !audioFileInfo.exists,
          story: !storyFileInfo.exists
        });
        throw new Error('Selected files are not accessible');
      }

      // Validate file sizes
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      if (audioFileInfo.size > MAX_FILE_SIZE || storyFileInfo.size > MAX_FILE_SIZE) {
        console.error('File size exceeded:', {
          audio: audioFileInfo.size,
          story: storyFileInfo.size,
          max: MAX_FILE_SIZE
        });
        throw new Error('Files must be smaller than 50MB');
      }

      // Calculate audio duration
      console.log('Calculating audio duration...');
      let duration = '3:00';
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioFile.uri },
          { shouldPlay: false }
        );
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          const seconds = Math.floor(status.durationMillis / 1000);
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          duration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
          console.log('Audio duration calculated:', duration);
        }
        await sound.unloadAsync();
      } catch (audioError) {
        console.warn('Failed to calculate audio duration:', audioError);
      }

      // Prepare story data
      console.log('Preparing story data...');
      const storyData = {
        title: formData.title.trim(),
        narrator: formData.narrator ? formData.narrator.trim() : 'Unknown Narrator',
        language: formData.language || 'Telugu',
        ageCategory: formData.ageCategory || 'All Ages',
        genre: formData.genre ? formData.genre.trim() : 'Uncategorized',
        mood: formData.mood ? formData.mood.trim() : 'Neutral',
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag)
          : [],
        hasPermission: !!formData.hasPermission,
        userId,
        audioFile: {
          name: audioFile.name,
          uri: audioFile.uri,
          size: audioFile.size,
          type: audioFile.type || 'audio/mpeg',
        },
        storyFile: {
          name: storyFile.name,
          uri: storyFile.uri,
          size: storyFile.size,
          type: storyFile.type || 'application/pdf',
        },
      };
      console.log('Story data prepared:', storyData);

      // Create FormData for file upload
      console.log('Creating FormData...');
      const formDataToSend = new FormData();
      formDataToSend.append('title', storyData.title);
      formDataToSend.append('narrator', storyData.narrator);
      formDataToSend.append('language', storyData.language);
      formDataToSend.append('ageCategory', storyData.ageCategory);
      formDataToSend.append('genre', storyData.genre);
      formDataToSend.append('mood', storyData.mood);
      formDataToSend.append('tags', JSON.stringify(storyData.tags));
      formDataToSend.append('hasPermission', storyData.hasPermission.toString());
      formDataToSend.append('userId', storyData.userId);
      formDataToSend.append('metadata', JSON.stringify({
        author: storyData.narrator,
        language: storyData.language,
        ageCategory: storyData.ageCategory,
        genre: storyData.genre,
        mood: storyData.mood,
        tags: storyData.tags,
        description: `${storyData.title} - A ${storyData.genre} in ${storyData.language} for ${storyData.ageCategory}`,
        rating: 0,
        plays: 0,
      }));

      // Append files
      console.log('Appending files to FormData...');
      formDataToSend.append('audio', {
        uri: storyData.audioFile.uri,
        type: storyData.audioFile.type,
        name: storyData.audioFile.name,
      });
      formDataToSend.append('story', {
        uri: storyData.storyFile.uri,
        type: storyData.storyFile.type,
        name: storyData.storyFile.name,
      });

      // API endpoint
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.109:3000/api/stories/generate';
      console.log('Sending request to:', API_URL);

      // Make API request
      console.log('Making API request...');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formDataToSend,
      });

      console.log('API response status:', response.status);
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: Failed to upload story`;
        try {
          const errorData = await response.json();
          console.error('API error response:', errorData);
          errorMessage = errorData.message || errorMessage;
          if (errorData.error) {
            errorMessage += `: ${errorData.error}`;
          }
        } catch (jsonError) {
          console.warn('Non-JSON response:', jsonError);
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('Story generation response:', responseData);

      // Save to local storage
      const newStory = {
        id: responseData.story.id,
        title: responseData.story.title,
        narrator: responseData.story.narrator,
        language: responseData.story.language,
        ageCategory: responseData.story.ageCategory,
        genre: responseData.story.genre,
        mood: responseData.story.mood,
        tags: responseData.story.tags,
        duration,
        type: 'generated',
        audioUrl: responseData.story.audioUrl,
        storyUrl: responseData.story.storyUrl,
        metadata: responseData.story.metadata,
        createdAt: responseData.story.createdAt
      };

      let updatedStories = [];
      try {
        const existingStories = await AsyncStorage.getItem('uploadedPDFs');
        const stories = existingStories ? JSON.parse(existingStories) : [];
        updatedStories = [...stories, newStory];
        await AsyncStorage.setItem('uploadedPDFs', JSON.stringify(updatedStories));
      } catch (storageError) {
        console.error('AsyncStorage error:', storageError);
        throw new Error('Failed to save story locally');
      }

      // Update state
      setUploadedPdfs(updatedStories);
      setAudioFile(null);
      setStoryFile(null);
      setFormData({
        title: '',
        narrator: '',
        language: 'Telugu',
        ageCategory: 'All Ages',
        genre: '',
        mood: '',
        tags: '',
        hasPermission: false,
      });

      // Navigate to stories tab
      router.push({
        pathname: '/(tabs)/stories',
        params: { 
          storyId: newStory.id,
          title: newStory.title,
          narrator: newStory.narrator,
          language: newStory.language,
          ageCategory: newStory.ageCategory,
          genre: newStory.genre,
          mood: newStory.mood,
          tags: newStory.tags.join(','),
          duration: newStory.duration,
          audioUrl: newStory.audioUrl,
          storyUrl: newStory.storyUrl,
        },
      });
    } catch (error) {
      console.error('Error saving generated story:', error);
      const errorMessage = error.message || 'Error saving the generated story. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearStorage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await AsyncStorage.clear();
      setUploadedPdfs([]);
      alert('Storage cleared successfully');
    } catch (e) {
      console.log('Error clearing AsyncStorage:', e);
      setError('Failed to clear storage');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="px-4 pt-6 pb-2">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-2xl font-bold text-white">Create Story</Text>
              <Text className="text-sm text-gray-400 mt-1">Upload your audio and story files</Text>
            </View>
          </View>
        </View>

        {error && (
          <View className="px-4 mb-4">
            <Text className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
              {error}
            </Text>
          </View>
        )}

        {/* Form Section */}
        <View className="px-4 mb-6">
          <View className="bg-[#282828] rounded-xl p-4 mb-4">
            <Text className="text-white text-lg font-semibold mb-4">Story Details</Text>
            
            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Title *</Text>
              <TextInput
                className="bg-[#1F1F1F] text-white px-4 py-3 rounded-lg"
                placeholder="Enter story title"
                placeholderTextColor="#666"
                value={formData.title}
                onChangeText={(text) => setFormData({...formData, title: text})}
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Narrator</Text>
              <TextInput
                className="bg-[#1F1F1F] text-white px-4 py-3 rounded-lg"
                placeholder="Enter narrator's name"
                placeholderTextColor="#666"
                value={formData.narrator}
                onChangeText={(text) => setFormData({...formData, narrator: text})}
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Language</Text>
              <CustomPicker
                selectedValue={formData.language}
                onValueChange={(value) => setFormData({...formData, language: value})}
                items={LANGUAGES}
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Age Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {AGE_CATEGORIES.map((age) => (
                  <TouchableOpacity
                    key={age}
                    className={`px-4 py-2 rounded-full ${
                      formData.ageCategory === age ? 'bg-[#1DB954]' : 'bg-[#1F1F1F]'
                    }`}
                    onPress={() => setFormData({...formData, ageCategory: age})}
                  >
                    <Text className={`text-sm font-medium ${
                      formData.ageCategory === age ? 'text-black' : 'text-white'
                    }`}>
                      {age}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Genre</Text>
              <CustomPicker
                selectedValue={formData.genre}
                onValueChange={(value) => setFormData({...formData, genre: value})}
                items={CATEGORIES}
                placeholder="Select Genre"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Mood</Text>
              <CustomPicker
                selectedValue={formData.mood}
                onValueChange={(value) => setFormData({...formData, mood: value})}
                items={MOODS}
                placeholder="Select Mood"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Tags (comma-separated)</Text>
              <TextInput
                className="bg-[#1F1F1F] text-white px-4 py-3 rounded-lg"
                placeholder="Enter tags (e.g., adventure, fantasy, magic)"
                placeholderTextColor="#666"
                value={formData.tags}
                onChangeText={(text) => setFormData({...formData, tags: text})}
              />
            </View>

            <View className="flex-row items-center mb-4">
              <Switch
                value={formData.hasPermission}
                onValueChange={(value) => setFormData({...formData, hasPermission: value})}
                trackColor={{ false: '#1F1F1F', true: '#1DB954' }}
                thumbColor={formData.hasPermission ? '#fff' : '#f4f3f4'}
              />
              <Text className="text-white text-sm ml-2 flex-1">
                I confirm I have permission to use this audio and story
              </Text>
            </View>
          </View>

          {/* Upload Section */}
          <View className="bg-[#282828] rounded-xl p-4 mb-4">
            <Text className="text-white text-lg font-semibold mb-4">Upload Files</Text>
            
            <TouchableOpacity 
              className="flex-row items-center bg-[#1F1F1F] p-4 rounded-lg mb-4"
              onPress={handleAudioUpload}
              disabled={isLoading}
            >
              <Ionicons name="mic" size={24} color="#1DB954" />
              <View className="ml-3 flex-1">
                <Text className="text-white font-medium">
                  {audioFile ? audioFile.name : 'Upload Audio'}
                </Text>
                {audioFile && (
                  <Text className="text-gray-400 text-sm">{audioFile.size}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center bg-[#1F1F1F] p-4 rounded-lg"
              onPress={handleStoryUpload}
              disabled={isLoading}
            >
              <Ionicons name="document-text" size={24} color="#1DB954" />
              <View className="ml-3 flex-1">
                <Text className="text-white font-medium">
                  {storyFile ? storyFile.name : 'Upload Story'}
                </Text>
                {storyFile && (
                  <Text className="text-gray-400 text-sm">{storyFile.size}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`w-full py-4 rounded-xl items-center ${
              audioFile && storyFile && formData.title && formData.hasPermission && !isLoading
                ? 'bg-[#1DB954]'
                : 'bg-[#1F1F1F]'
            }`}
            onPress={handleGenerateStory}
            disabled={!(audioFile && storyFile && formData.title && formData.hasPermission) || isLoading}
          >
            <Text className="text-white font-semibold text-lg">
              {isLoading ? 'Processing...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Previous Stories Section */}
        <View className="px-4 mb-6">
          <Text className="text-white text-lg font-semibold mb-4">Previous Stories</Text>
          {isLoading ? (
            <View className="items-center py-4">
              <Text className="text-gray-400">Loading stories...</Text>
            </View>
          ) : uploadedPdfs.length === 0 ? (
            <View className="items-center py-4">
              <Text className="text-gray-400">No stories uploaded yet</Text>
            </View>
          ) : (
            uploadedPdfs.map((pdf) => (
              <TouchableOpacity
                key={pdf.id}
                className="flex-row items-center bg-[#282828] p-4 rounded-xl mb-3"
                onPress={() => handleViewStory(pdf)}
              >
                <View className="w-12 h-12 rounded-lg bg-[#1F1F1F] justify-center items-center mr-3">
                  <Ionicons name="document-text" size={24} color="#1DB954" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium mb-1" numberOfLines={1}>
                    {pdf.title}
                  </Text>
                  <Text className="text-gray-400 text-sm" numberOfLines={1}>
                    {pdf.narrator} • {pdf.duration}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          className="mx-4 mb-6 py-4 rounded-xl bg-[#282828] items-center"
          onPress={clearStorage}
          disabled={isLoading}
        >
          <Text className="text-red-500 font-semibold">
            {isLoading ? 'Clearing...' : 'Clear Storage'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: 'white',
    height: 55,
  },
});