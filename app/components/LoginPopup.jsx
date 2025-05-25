import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useEffect, useRef } from 'react';

export default function LoginPopup({ visible, onClose }) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleLogin = () => {
    onClose();
    router.push('/auth/signIn');
  };

  const handleSignup = () => {
    onClose();
    router.push('/auth/signUp');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={tw`flex-1 justify-center items-center`}>
        <Animated.View
          style={[
            tw`w-[90%] bg-white rounded-3xl p-6`,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={tw`items-center mb-6`}>
            <View style={tw`w-16 h-16 rounded-full bg-[#1DB954]/20 justify-center items-center mb-4`}>
              <Ionicons name="lock-closed" size={32} color="#1DB954" />
            </View>
            <Text style={tw`text-2xl font-bold text-gray-900 mb-2 text-center`}>
              Sign In Required
            </Text>
            <Text style={tw`text-base text-gray-600 text-center`}>
              Please sign in to access this feature
            </Text>
          </View>

          <View style={tw`space-y-4`}>
            <TouchableOpacity
              onPress={handleLogin}
              style={tw`bg-[#1DB954] rounded-2xl py-4 items-center`}
            >
              <Text style={tw`text-white font-bold text-lg`}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSignup}
              style={tw`bg-gray-100 rounded-2xl py-4 items-center`}
            >
              <Text style={tw`text-gray-900 font-bold text-lg`}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={tw`py-2`}
            >
              <Text style={tw`text-gray-500 text-center`}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
} 