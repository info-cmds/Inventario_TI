'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import LoginView from '@/components/LoginView';

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push('/');
  };

  return <LoginView onLoginSuccess={handleLoginSuccess} />;
}
