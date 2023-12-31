import { Outlet } from "react-router-dom";

import MyWorker from '../worker?worker';
import { useEffect } from "react";
import toast from "react-hot-toast";

const worker = new MyWorker();

export default function Layout () {
  useEffect(() => {
    worker.onmessage = (event: MessageEvent) => {
      toast.loading(event.data.data, { id: 'zkapp-loader-toast' });
    };
  }, []);

  return <div className="min-h-[100vh] relative">
    <h1>ZkInvoices</h1>
    <Outlet/>
  </div>
}