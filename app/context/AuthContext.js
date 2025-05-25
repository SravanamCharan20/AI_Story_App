import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

// Create the context
const AuthContext = createContext({
  signIn: async (userData) => {},
  signOut: async () => {},
  forceSignIn: () => {},
  continueAsGuest: async () => {},
  user: null,
  isLoading: true,
});

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route hook
function useProtectedRoute(user) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';

    // Only redirect if we're not already in the auth group
    if (!user && !inAuthGroup && !user?.isGuest) {
      router.replace('/auth/signIn');
    } else if (user && !user.isGuest && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [user, segments]);
}

// Provider component
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useProtectedRoute(user);

  // Check for stored user data
  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const [userData, isGuest] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('isGuest')
      ]);

      if (isGuest === 'true') {
        setUser({ isGuest: true });
      } else if (userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('Error checking for stored user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(userData) {
    try {
      // Clear guest mode if it exists
      await AsyncStorage.removeItem('isGuest');
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      router.replace('/(tabs)/home');
    } catch (error) {
      throw new Error('Error storing user data');
    }
  }

  async function signOut() {
    try {
      await Promise.all([
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('isGuest')
      ]);
      setUser(null);
      router.replace('/auth/signIn');
    } catch (error) {
      throw new Error('Error removing user data');
    }
  }

  const forceSignIn = () => {
    setUser(null);
    router.replace('/auth/signIn');
  };

  const continueAsGuest = async () => {
    try {
      // Clear any existing user data
      await AsyncStorage.removeItem('user');
      await AsyncStorage.setItem('isGuest', 'true');
      setUser({ isGuest: true });
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error setting guest mode:', error);
      throw new Error('Failed to continue as guest');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        forceSignIn,
        continueAsGuest,
        user,
        isLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
} 