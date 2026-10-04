'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoginModal } from './LoginModal';

/**
 * Global AuthModal bound to AuthContext state.
 * Uses LoginModal which renders directly to document.body via React Portal.
 */
export function AuthModal() {
  const { authModalOpen, setAuthModalOpen } = useAuth();

  return (
    <LoginModal
      isOpen={authModalOpen}
      onClose={() => setAuthModalOpen(false)}
    />
  );
}

export default AuthModal;
