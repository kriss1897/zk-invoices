import { initializeApp } from "firebase/app";
import NiceModal from '@ebay/nice-modal-react';
import InvoiceModal from './components/NewInvoiceModal';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import UserContext from './context/UserContext';
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import Invoices from "./components/Invoices";
import Login from "./pages/login";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const auth = getAuth();

NiceModal.register('create-invoice-modal', InvoiceModal);

function App() {
  const [user, setUser] = useState<User|null>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
  }, []);

  if (!user) {
    return <Login />
  }

  return <UserContext.Provider value={user}>
    <NiceModal.Provider>
      <Toaster position='top-right' />
      <Invoices />
    </NiceModal.Provider>
  </UserContext.Provider>
}

export default App
