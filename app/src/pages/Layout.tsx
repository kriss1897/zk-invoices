import { Outlet } from "react-router-dom";

import MyWorker from "../worker?worker";
import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import UserContext from "../context/UserContext";
import { Loader } from "../components/Loader";
import { Button } from "@/components/ui/button";
import { getAuth } from "firebase/auth";

const worker = new MyWorker();

export default function Layout() {
  const { user, loading } = useContext(UserContext);
  const [compiled, setCompiled] = useState(false);

  useEffect(() => {
    let compiled = false;

    worker.onmessage = (event: any) => {
      const { type, action } = event.data || {};

      if (type === "response" && action === "transaction") {
        sendTransaction(event.data.data.txn);

        return;
      }
      
      if (compiled) {
        return;
      }

      if (type === "zkapp" && action === "compiled") {
        setCompiled(true);
      } else if (type === "update") {
        toast.loading(event.data.data, { id: "zkapp-loader-toast" });
      }
    };
  }, []);

  useEffect(() => {
    if (compiled) {
      toast.success("Compiled", { id: "zkapp-loader-toast" });
    }
  }, [compiled]);
  
  function mint() {
    worker.postMessage({ action: 'mint', data: { address: user?.uid } });
  }

  async function sendTransaction(txn: any) {
    const fee = "";
    const memo = "";

    const payload = {
      transaction: txn,
      feePayer: {
        fee: fee,
        memo: memo,
      },
    };

    try {
      await (window as any).mina.sendTransaction(payload);
    } catch (error: any) {
      console.log(error);
    }
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-[100vh] relative">
      <div className="max-w-2xl flex mx-auto mt-4">
        <h1>zkInvoices</h1>
        <div className="grow"></div>
        {user && <Button onClick={() => getAuth().signOut()}>Signout</Button>}
      </div>
      <Outlet />
    </div>
  );
}
