import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { addDoc, collection, getFirestore } from "firebase/firestore";
import Invoices from "@/components/Invoices";
import toast from "react-hot-toast";
import { useModal } from "@ebay/nice-modal-react";

function HomeContent() {
  const _workerRef = useRef<Worker>();
  const [loading, setLoading] = useState(true);
  const [txnLoading, setTxnLoading] = useState(false);
  const [state, setState] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [toastId, setToastId] = useState<string>("");
  const modal = useModal('create-invoice-modal');

  useEffect(() => {
    const worker = new Worker(new URL("../worker.ts", import.meta.url));
    _workerRef.current = worker;

    _workerRef.current.onmessage = (evt) => {
      const { type, action, data } = evt.data;

      if (type === "update") {
        setStatus(data);
      }

      if (type === "response" && action === "getCommitment") {
        return setState(data.commitment);
      }

      if (type === "response" && action === "transaction") {
        sendTransaction(data.txn);
      }

      if (type === "zkapp" && action === "compiled") {
        _workerRef.current?.postMessage({ action: "getCommitment" });
        setLoading(false);
      }
    };

    loadAccounts().then(setAccount);
  }, []);

  useEffect(() => {
    const isLoading = loading || txnLoading;
    if (isLoading && !toastId) {
      const toastId = toast.loading("Start Loading");
      setToastId(toastId);

      return;
    }

    if (isLoading) {
      toast.loading(status, {
        id: toastId,
      });
    }

    if (!isLoading && toastId) {
      toast.success("Done", {
        id: toastId,
      });
      setToastId("");
    }
  }, [loading, status, txnLoading]);

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

      setTxnLoading(false);
    } catch (error: any) {
      setTxnLoading(true);
      setStatus(error.message);
    }
  }

  async function commit() {
    _workerRef.current?.postMessage({ action: "commit" });
    setStatus("");
    setTxnLoading(true);
  }

  async function createInvoice(invoice: any) {
    const db = getFirestore();
    const _col = collection(db, "invoices");

    addDoc(_col, Object.assign({ createdAt: new Date() }, invoice));

    // _workerRef.current?.postMessage({ action: 'createInvoice', data: invoice });
    // setStatus('');
    // setTxnLoading(true);
  }

  async function loadAccounts() {
    let accounts;

    if (!(window as any).mina) {
      return;
    }

    try {
      // Accounts is an array of string Mina addresses.
      accounts = await (window as any).mina.requestAccounts();

      // Show first 6 and last 4 characters of user's Mina account.
      return accounts[0];
    } catch (err: any) {
      // If the user has a wallet installed but has not created an account, an
      // exception will be thrown. Consider showing "not connected" in your UI.
      console.log(err.message);
    }
  }

  if (loading) {
    return <></>;
  }

  return (
    <>
      <Head>
        <title>zk Invoices</title>
        <meta name="description" content="built with o1js" />
        <link rel="icon" href="/assets/favicon.ico" />
      </Head>
      <div className="max-w-2xl my-8 p-4 mx-auto space-y-4 text-center">
        <div>
          {(window as any).mina && <p>Connected Account: {account}</p>}
          {!(window as any).mina && (
            <a
              className="w-full block py-2 bg-yellow-400 shadow-lg text-yellow-900 rounded-md"
              href="https://www.aurowallet.com/"
            >
              Install auro wallet
            </a>
          )}
        </div>
        <div className="space-x-2 flex flex-row">
          <button
            className="grow basis-2 py-2 bg-white text-slate-800 border rounded-md"
            onClick={() => modal.show().then(console.log)}
          >
            Create New
          </button>
          <button
            className="grow py-2 bg-white text-slate-800 border rounded-md"
            onClick={commit}
          >
            Commit
          </button>
        </div>
        <div>
          <small className="text-gray-400">Committed tree root: {state}</small>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <>
      <div className="max-w-2xl my-8 mx-auto space-y-4">
        <h1 className="text-3xl font-medium"><span className="text-blue-950">zk</span>Invoices</h1>
      </div>
      <HomeContent />
      <Invoices />
    </>
  );
}
