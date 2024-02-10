import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';

import Layout from './pages/Layout';
import { useContext } from 'react';
import UserContext from './context/UserContext';
import { Loader } from './components/Loader';
import Invoices from './components/Invoices';
import Login from './pages/login';
import { User } from 'firebase/auth';

const router = (user: User | null) =>
  createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />}>
        <Route path="/" element={user ? <Invoices /> : <Login />} />
        <Route path="/login" element={<Login />} />
      </Route>
    )
  );

export default function Router() {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return <Loader />;
  }

  return <RouterProvider router={router(user)} />;
}
