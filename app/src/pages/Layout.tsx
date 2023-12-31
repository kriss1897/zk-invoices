import { Outlet } from "react-router-dom";

import MyWorker from '../worker?worker';
import { useEffect } from "react";
import toast from "react-hot-toast";

const worker = new MyWorker();

export default function Layout () {
  useEffect(() => {
    const toastId = toast.loading('Loading zkApp');
    worker.onmessage = (event: MessageEvent) => {
      toast(event.data.data, { id: toastId, });
    };
  }, []);

  return <div className="min-h-[100vh] relative">
    <h1>ZkInvoices</h1>
    <Outlet/>
  </div>
}