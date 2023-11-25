import UserContext from "../context/UserContext";
import { getAuth, signInAnonymously, signInWithRedirect } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { useContext } from "react";

export default function Login() {
  const user = useContext(UserContext);

  function authenticate() {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();

    signInWithRedirect(auth, provider);
  }

  function anonymousLogin() {
    const auth = getAuth();

    signInAnonymously(auth).then(() => {
      window.location.pathname = '/';
    });
  }

  if (user) {
    window.location.pathname = '/';

    return <></>
  }

  return (
    <div className="max-w-md mx-auto mt-14 space-y-4">
      <button
        className="px-4 mx-auto block py-2 rounded-lg shadow-sm hover:shadow-xl text-center bg-black text-white"
        onClick={authenticate}
      >
        Login with google
      </button>
      <button
        className="px-4 mx-auto block py-2 rounded-lg shadow-sm hover:shadow-xl text-center bg-black text-white"
        onClick={anonymousLogin}
      >
        Anonymous Login
      </button>
    </div>
  );
}
