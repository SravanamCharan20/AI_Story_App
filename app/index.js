import { Redirect } from 'expo-router';
import { useAuth } from './context/AuthContext';
import "../global.css"

export default function Index() {
  const { user, isLoading } = useAuth();

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // Always redirect to home page, regardless of authentication state
  return <Redirect href="/(tabs)/home" />;
} 