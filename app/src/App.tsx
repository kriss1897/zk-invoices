import { initializeApp } from "firebase/app";
import NiceModal from "@ebay/nice-modal-react";
import InvoiceModal from "./components/NewInvoiceModal";
import UserContext, { UserProvider } from "./context/UserContext";
import { Toaster } from "react-hot-toast";
import Invoices from "./components/Invoices";
import Login from "./pages/login";
import { useContext } from "react";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

// Initialize Firebase
initializeApp(firebaseConfig);

NiceModal.register("create-invoice-modal", InvoiceModal);

function App() {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return <p>Loading auth information</p>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <Invoices />
    </>
  );
}

export default function AppContainer() {
  return (
    <UserProvider>
      <NiceModal.Provider>
        <Toaster position="top-right" />
        <App />
      </NiceModal.Provider>
    </UserProvider>
  );
}
