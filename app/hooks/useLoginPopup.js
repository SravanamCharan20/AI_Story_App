import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function useLoginPopup() {
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const { user } = useAuth();

  const checkAuth = useCallback((action) => {
    if (!user) {
      setShowLoginPopup(true);
      return false;
    }
    return true;
  }, [user]);

  const closeLoginPopup = useCallback(() => {
    setShowLoginPopup(false);
  }, []);

  return {
    showLoginPopup,
    closeLoginPopup,
    checkAuth,
  };
} 