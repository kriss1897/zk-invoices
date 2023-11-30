import { Outlet } from "react-router-dom";

export default function Layout () {
  return <div className="min-h-[100vh] relative">
    <h1>ZkInvoices</h1>
    <Outlet/>
  </div>
}