import Head from "next/head";
import { useEffect, useRef, useState } from "react";

import { PrivateKey } from 'o1js';

import { addDoc, collection, getDocs, getFirestore, onSnapshot, query } from "firebase/firestore";

function useRandomInvoice() {
  const [invoice, setInvoice] = useState({
    from: PrivateKey.random().toPublicKey().toBase58().toString(),
    to: PrivateKey.random().toPublicKey().toBase58().toString(),
    amount: Math.floor(Math.random() * 1000)
  });

  function regenerate() {
    setInvoice({
      from: PrivateKey.random().toPublicKey().toBase58().toString(),
      to: PrivateKey.random().toPublicKey().toBase58().toString(),
      amount: Math.floor(Math.random() * 1000)
    });
  }

  return { invoice, regenerate };
}

function ShortAddress({ address, length = 3 }: { address: string, length?: number }) {
  return <p>{address.slice(0, length)}...{address.slice(address.length - length)}</p>
}

function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const db = getFirestore();

    onSnapshot(
      query(collection(db, 'invoices')),
      (snap) => setInvoices(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );
  }, []);

  return <div className="space-y-4 max-w-2xl mx-auto">
    <h2 className="text-2xl">Invoices</h2>
    { invoices.map((invoice, idx) => <div className="shadow-lg p-2 rounded-lg bg-white" key={`invoice:${invoice.id}`}>
        <div className="flex flex-row">
          <div className="grow">
            <small className="text-gray-400 mt-4">From</small>
            <ShortAddress address={invoice.from} length={5}/>
            <small className="text-gray-400 mt-4">To</small>
            <ShortAddress address={invoice.to} length={5}/>
          </div>
          <div className="w-32 text-center align-middle mt-8 text-xl font-medium">
            <p>Rs. {invoice.amount}</p>
          </div>
        </div>
      </div>
    )}
  </div>
}

function HomeContent() {
  const _workerRef = useRef<Worker>();
  const [loading, setLoading] = useState(true);
  const [txnLoading, setTxnLoading] = useState(false);
  const [state, setState] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const { invoice, regenerate } = useRandomInvoice();

  useEffect(() => {
    _workerRef.current = new Worker(new URL("../worker.ts", import.meta.url));

    _workerRef.current.onmessage = (evt) => {
      const { type, action, data } = evt.data;

      if (type === 'update') {
        setStatus(data);
      }

      if (type === 'response' && action === 'getCommitment') {
        return setState(data.commitment);
      }

      if (type === 'response' && action === 'transaction') {
        sendTransaction(data.txn);
      }

      if (type === 'zkapp' && action === 'compiled') {
        _workerRef.current?.postMessage({ action: 'getCommitment' })
        setLoading(false);
      }
    };

    loadAccounts().then(setAccount);
  }, []);

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
    _workerRef.current?.postMessage({ action: 'commit' });
    setStatus('');
    setTxnLoading(true);
  }

  async function createInvoice() {
    const db = getFirestore();
    const _col = collection(db, 'invoices');
    
    addDoc(_col, invoice);
    regenerate();

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
    return <>
      <Head>
        <title>zk Invoices</title>
        <meta name="description" content="built with o1js" />
        <link rel="icon" href="/assets/favicon.ico" />
      </Head>
      <div className="text-center max-w-2xl mx-auto bg-white shadow-md rounded-xl my-8 p-4">
        <h2 className="text-2xl mb-4">Setting up zkApp</h2>
        <p className="text-base animate-pulse mb-4">{status}</p>
        <small className="text-gray-400">Should only take about a minute</small>
      </div>
    </>
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
        { (window as any).mina && <p>Connected Account: {account}</p> }
        { !(window as any).mina && <a className="w-full block py-2 bg-yellow-400 shadow-lg text-yellow-900 rounded-md" href="https://www.aurowallet.com/">Install auro wallet</a> }
        </div>
        <div className="text-center mx-auto bg-white shadow-md rounded-xl p-4 space-y-2">
          <h2 className="text-2xl mb-4">Invoices zkApp</h2>
          <h3></h3>
          <small className="text-gray-400">For the purpose of this PoC, all the invoice data is generated randomly</small>
          { !txnLoading && <div>
            <div className="space-y-2 text-left">
              <label>From</label>
              <input id="invoice-from" className="w-full border bg-gray-50 rounded-md p-2" readOnly value={invoice.from}/>
              <label>To</label>
              <input id="invoice-to" className="w-full border bg-gray-50 rounded-md p-2" readOnly value={invoice.to}/>
              <label>Amount</label>
              <input id="invoice-amount" className="w-full border bg-gray-50 rounded-md p-2" readOnly value={invoice.amount}/>
            </div>
            <button className="w-full py-2 bg-white text-slate-800 border rounded-md" onClick={regenerate}>Randomize</button>
            <button className="w-full py-2 bg-slate-800 text-white font-bold rounded-md" onClick={createInvoice}>Create Invoice</button>
          </div> }
          { txnLoading && <div>
              <h2 className="text-2xl mb-4">Creating proof for transaction</h2>
              <p className="text-base animate-pulse mb-4">{status}</p>
              <small className="text-gray-400">Should only take about a minute</small>
          </div>}
        </div>
        <div className="space-y-2">
          <small>For the invoices that are already added in the actions</small>
          <button className="w-full py-2 bg-white text-slate-800 border rounded-md" onClick={commit}>Commit updated invoices</button>
        </div>
        <div>
          <small className="text-gray-400">Committed tree root: {state}</small>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  return <>
    <HomeContent />
    <Invoices />
  </>
}