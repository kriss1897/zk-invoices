import '@/styles/globals.css'
import type { AppProps } from 'next/app'

import { initializeApp } from "firebase/app";
import dynamic from 'next/dynamic';
import NiceModal from '@ebay/nice-modal-react';
import InvoiceModal from '@/components/NewInvoiceModal';
import { useEffect, useState } from 'react';
import { User, getAuth, onAuthStateChanged } from 'firebase/auth';
import UserContext from '@/contexts/UserContext';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const auth = getAuth();

NiceModal.register('create-invoice-modal', InvoiceModal);

const Toaster = dynamic(
  () => import("react-hot-toast").then((c) => c.Toaster),
  {
    ssr: false,
  }
);

export default function App({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState<User|null>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
  }, []);

  return <UserContext.Provider value={user}>
    <NiceModal.Provider>
      <Toaster position='top-right' />
      <Component {...pageProps} />
    </NiceModal.Provider>
  </UserContext.Provider>
}
