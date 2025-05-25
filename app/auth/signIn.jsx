import { Text, View, TouchableOpacity, Animated, TextInput, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignIn() {
  const router = useRouter();
  const { signIn, continueAsGuest } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateInputs = () => {
    let isValid = true;
    const newErrors = {
      email: '',
      password: '',
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      const firstError = Object.values(errors).find(error => error !== '');
      if (firstError) {
        Alert.alert('Validation Error', firstError);
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.0.105:3000/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      await signIn(data.user);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueWithoutLogin = async () => {
    try {
      await continueAsGuest();
    } catch (error) {
      Alert.alert('Error', 'Failed to continue as guest. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1`}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1DB954', '#191414']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tw`flex-1`}
      >
        <ScrollView 
          contentContainerStyle={tw`flex-1 justify-center`}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              tw`flex-1 justify-center items-center px-5`,
              {
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            <View style={tw`bg-white/95 rounded-[35px] p-8 w-full items-center shadow-xl`}>
              <View style={tw`items-center mb-8`}>
                <View style={tw`w-20 h-20 rounded-full bg-[#1DB954]/20 justify-center items-center mb-5`}>
                  <Ionicons name="book" size={40} color="#1DB954" />
                </View>
                <Text style={tw`text-3xl font-extrabold text-gray-900 mb-2 text-center`}>
                  Welcome Back!
                </Text>
                <Text style={tw`text-base text-gray-600 text-center`}>
                  Continue your storytelling journey
                </Text>
              </View>

              <View style={tw`w-full space-y-4`}>
                <View style={tw`flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 ${errors.email ? 'border border-red-500' : ''}`}>
                  <Text style={tw`text-xl mr-3`}>✉️</Text>
                  <TextInput
                    style={tw`flex-1 text-base text-gray-900`}
                    placeholder="Email Address"
                    placeholderTextColor="#666"
                    value={formData.email}
                    onChangeText={(text) => {
                      setFormData({ ...formData, email: text });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email ? <Text style={tw`text-red-500 text-sm ml-4`}>{errors.email}</Text> : null}

                <View style={tw`flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 ${errors.password ? 'border border-red-500' : ''}`}>
                  <Text style={tw`text-xl mr-3`}>🔒</Text>
                  <TextInput
                    style={tw`flex-1 text-base text-gray-900`}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    value={formData.password}
                    onChangeText={(text) => {
                      setFormData({ ...formData, password: text });
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={tw`p-2`}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={tw`text-red-500 text-sm ml-4`}>{errors.password}</Text> : null}

                <TouchableOpacity
                  style={tw`self-end -mt-2`}
                  onPress={() => {/* Handle forgot password */}}
                >
                  <Text style={tw`text-[#1DB954] font-semibold`}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={tw`bg-[#1DB954] rounded-2xl py-4 items-center shadow-lg`}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={tw`text-white font-semibold text-lg`}>Sign In</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleContinueWithoutLogin}
                  style={tw`bg-gray-100 rounded-2xl py-4 items-center`}
                >
                  <Text style={tw`text-gray-600 font-semibold text-lg`}>Continue without login</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/auth/signUp")}
                  style={tw`mt-4`}
                >
                  <Text style={tw`text-gray-600 text-center`}>
                    New to StoryTime? <Text style={tw`text-[#1DB954] font-semibold`}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}