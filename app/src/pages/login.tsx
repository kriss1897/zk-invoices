import UserContext from "../context/UserContext";
import { getAuth, signInAnonymously, signInWithCustomToken, signInWithRedirect } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { useContext } from "react";

function LoginWithMina() {
  async function authenticate() {
    const minaProvider: any = (window as any).mina;

    if (minaProvider) {
      await minaProvider.requestAccounts();

      const sign = await (window as any).mina.signMessage({
        message: "login to invoices",
      });
      
      const data = await fetch('http://localhost:3000/login', {
        method: "POST",
        body: JSON.stringify(sign),
        headers: {
          "Content-Type": "application/json",
        },
      } as any).then((res) => res.json());

      if (!data.token) { return; }

      const auth = getAuth();
      await signInWithCustomToken(auth, data.token);
    } else {
      alert("wallet not found");
    }
  }

  return (
    <button
      className="px-4 mx-auto block py-2 rounded-lg shadow-sm hover:shadow-xl text-center bg-orange-100 text-orange-900"
      onClick={authenticate}
    >
      Login with Mina
    </button>
  );
}

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
      window.location.pathname = "/";
    });
  }

  if (user) {
    window.location.pathname = "/";

    return <></>;
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
      <LoginWithMina />
    </div>
  );
}
