import { useContext, useEffect, useState } from "react";
import {
  QuerySnapshot,
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { User, getAuth } from "firebase/auth";
import UserContext from "../context/UserContext";
import { Button } from "@/components/ui/button";

function ShortAddress({
  address,
  length = 3,
}: {
  address: string;
  length?: number;
}) {
  return (
    <p>
      {address.slice(0, length)}...{address.slice(address.length - length)}
    </p>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const db = getFirestore();
    const userId = (user as User).uid;

    function formatInvoicesSnapshot(snap: QuerySnapshot) {
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    onSnapshot(
      query(
        collection(db, "invoices"),
        where("from", "==", userId),
        orderBy("createdAt", "desc")
      ),
      (snap) => {
        const invoices = formatInvoicesSnapshot(snap);

        setInvoices(invoices);
      }
    );
  }, []);


  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <small className="block">Persistent Root: {treeRoot}</small>
      <Button onClick={() => getAuth().signOut()}>Signout</Button>
      {invoices.map((invoice) => (
        <div
          className="shadow-lg p-2 rounded-lg bg-white"
          key={`invoice:${invoice.id}`}
        >
          <div className="flex flex-row">
            <div className="grow">
              <small className="text-gray-400 mt-4">From</small>
              <ShortAddress address={invoice.from} length={5} />
              <small className="text-gray-400 mt-4">To</small>
              <ShortAddress address={invoice.to} length={5} />
            </div>
            <div className="w-32 text-center align-middle mt-8 text-xl font-medium">
              <p>Rs. {invoice.amount}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
