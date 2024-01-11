import { Outlet } from "react-router-dom";

import MyWorker from '../worker?worker';
import { useEffect } from "react";
import toast from "react-hot-toast";

const worker = new MyWorker();

export default function Layout () {
  useEffect(() => {
    let compiled = false;

    worker.onmessage = (event: any) => {
      const { type, action } = event.data || {};
      if (compiled) { return; }

      if (type === 'zkapp' && action === 'compiled') {
        compiled = true;
        toast.success('Compiled', { id: 'zkapp-loader-toast' })
      }
      else if (type === 'update') {
        toast.loading(event.data.data, { id: 'zkapp-loader-toast' });
      }
    };
  }, []);

  return <div className="min-h-[100vh] relative">
    <h1>ZkInvoices</h1>
    <Outlet/>
  </div>
}