import { Redirect } from 'expo-router';
import { useAuth } from './context/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // Redirect based on authentication state
  if (user) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/auth/signIn" />;
} 