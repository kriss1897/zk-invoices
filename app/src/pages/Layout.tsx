import { Outlet } from "react-router-dom";

export default function Layout () {
  return <div className="min-h-[100vh] relative">
    <Outlet/>
  </div>
}