import { Outlet } from "react-router-dom";

import MyWorker from "../worker?worker";
import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import UserContext from "../context/UserContext";
import { Loader } from "../components/Loader";
import { Button } from "@/components/ui/button";
import { User, getAuth } from "firebase/auth";
import { LogOutIcon, User2Icon } from "lucide-react";
import InvoicesMinaApp from "../components/InvoicesMinaApp";
import { useModal } from "@ebay/nice-modal-react";

const worker = new MyWorker();

function Header({ user }: { user: null | User }) {
  const userAccountModal = useModal('invoice-account-modal');

  return (
    <header className="bg-slate-900 py-4">
    <div className="max-w-2xl flex mx-auto ">
      <h1 className="text-white font-extrabold text-3xl"><span className="text-cyan-300">zk</span>Invoices</h1>
      <div className="grow"></div>
      {user && <Button variant="ghost" className="text-white" onClick={() => userAccountModal.show({ address: user?.uid as string })}><User2Icon/></Button>}
      {user && <Button variant="ghost" className="text-white" onClick={() => getAuth().signOut()}><LogOutIcon /></Button>}
    </div>
    </header>
  );
}

export default function Layout() {
  const { user, loading } = useContext(UserContext);
  const [compiled, setCompiled] = useState(false);

  useEffect(() => {
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
    worker.postMessage({ action: "mint", data: { address: user?.uid } });
  }

  function createInvoice(from: string, to: string, amount: number) {
    worker.postMessage({ action: "createInvoice", data: { from, to, amount } });
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
      <Header user={user} />
      {user && (
        <div className="max-w-2xl flex mx-auto mt-4">
          <InvoicesMinaApp address={user?.uid as string} handleCreate={mint} />
        </div>
      )}
      <Outlet context={{ createInvoice }}/>
    </div>
  );
}
