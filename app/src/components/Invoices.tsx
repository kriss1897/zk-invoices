import { useContext, useEffect, useState } from "react";
import {
  QuerySnapshot,
  collection,
  getFirestore,
  onSnapshot,
  or,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { User, getAuth } from "firebase/auth";
import UserContext from "../context/UserContext";
import { Button } from "@/components/ui/button";
import { ShortAddress } from "src/utils/common";

type RawInvoice = {
  id: string
  from: string,
  to: string,
  amount: number
}

export default function Invoices() {
  const [sentInvoices, setSentInvoices] = useState<any[]>([]);
  const [receivedInvoices, setReceivedInvoices] = useState<any[]>([]);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const db = getFirestore();
    const userId = (user as User).uid;

    function formatInvoicesSnapshot(snap: QuerySnapshot): RawInvoice[] {
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as RawInvoice));
    }

    onSnapshot(
      query(
        collection(db, "invoices"),
        or(
          where("from", "==", userId),
          where("to", "==", userId),
        ),
        orderBy("createdAt", "desc")
      ),
      (snap) => {
        const invoices = formatInvoicesSnapshot(snap);
        const sent: RawInvoice[] = [];
        const received: RawInvoice[] = [];

        invoices.forEach((invoice) => {
          if (invoice.to === userId) {
            received.push(invoice);
            return;
          }

          sent.push(invoice);
        });

        setSentInvoices(sent);
        setReceivedInvoices(received);
      }
    );
  }, []);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Button onClick={() => getAuth().signOut()}>Signout</Button>
      <p>Sent Invoices</p>
      {sentInvoices.map((invoice) => (
        <div
          className="shadow-lg p-2 rounded-lg bg-white"
          key={`invoice:${invoice.id}`}
        >
          <div className="flex flex-row">
            <div className="grow">
              <small className="text-gray-400 mt-4">To</small>
              <ShortAddress address={invoice.to} length={5} />
            </div>
            <div className="w-32 text-center align-middle mt-8 text-xl font-medium">
              <p>Rs. {invoice.amount}</p>
            </div>
          </div>
        </div>
      ))}
      <p>Received Invoices</p>
      {receivedInvoices.map((invoice) => (
        <div
          className="shadow-lg p-2 rounded-lg bg-white"
          key={`invoice:${invoice.id}`}
        >
          <div className="flex flex-row">
            <div className="grow">
              <small className="text-gray-400 mt-4">From</small>
              <ShortAddress address={invoice.from} length={5} />
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
