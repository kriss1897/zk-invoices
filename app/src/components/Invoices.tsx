import { useContext, useEffect, useState } from 'react';
import {
  QuerySnapshot,
  collection,
  getFirestore,
  onSnapshot,
  or,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { User } from 'firebase/auth';
import UserContext from '../context/UserContext';
import { ShortAddress } from '../utils/common';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useModal } from '@ebay/nice-modal-react';

import { RawInvoice, createInvoice } from '../services/InvoiceService';
import { useOutletContext } from 'react-router-dom';
import { Field } from 'o1js';

function SentInvoiceCard({
  invoice,
  mint,
}: {
  invoice: RawInvoice;
  mint?: () => void;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-row items-center">
          <div className="grow">
            <small className="text-gray-400">Sent to</small>
            <ShortAddress address={invoice.to} length={10} />
          </div>
          <div className="text-center align-middle text-xl font-medium">
            <p>Rs. {invoice.amount}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 py-2">
        {mint && (
          <div className="flex flex-row w-full items-center">
            <Badge variant="secondary">Not Committed</Badge>
            <div className="flex-grow"></div>
            <Button variant="outline" onClick={() => mint()}>
              Mint
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default function Invoices() {
  const outlet: any = useOutletContext();
  const createInvoiceModal = useModal('create-invoice-modal');
  const [sentInvoices, setSentInvoices] = useState<any[]>([]);
  const [receivedInvoices, setReceivedInvoices] = useState<any[]>([]);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const db = getFirestore();
    const userId = (user as User).uid;

    function formatInvoicesSnapshot(snap: QuerySnapshot): RawInvoice[] {
      return snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as RawInvoice
      );
    }

    onSnapshot(
      query(
        collection(db, 'invoices'),
        or(where('from', '==', userId), where('to', '==', userId)),
        orderBy('createdAt', 'desc')
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

  async function initNewInvoice() {
    const { invoice }: any = await createInvoiceModal.show({ from: user?.uid });

    createInvoice(invoice);
  }

  async function mintInvoice(id: Field, from: string, to: string, amount: number, dueDate: Date) {
    outlet.createInvoice(id, from, to, amount, dueDate);
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto mt-4">
      <Tabs defaultValue="sent" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
        </TabsList>
        <TabsContent value="sent" className="space-y-2">
          {sentInvoices.length === 0 ? (
            <Alert className="text-center space-y-4">
              <AlertTitle>Send you first invoice today</AlertTitle>
              <AlertDescription className="space-y-4">
                <p className="block">
                  You have not yet experienced the new age of provable invoices.
                </p>
                <Button variant="outline" onClick={initNewInvoice}>
                  Send New Invoice
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Button className="w-full" onClick={initNewInvoice}>
              Send New Invoice
            </Button>
          )}
          {sentInvoices.map((invoice) => (
            <SentInvoiceCard
              invoice={invoice}
              key={invoice.id}
              mint={() =>
                mintInvoice(Field.from(invoice.minaId), user?.uid as string, invoice.to, invoice.amount, invoice.dueDate)
              }
            />
          ))}
        </TabsContent>
        <TabsContent value="received">
          {receivedInvoices.length === 0 && (
            <Alert className="text-center space-y-4">
              <AlertTitle>Empty!</AlertTitle>
              <AlertDescription>
                You have not received any invoices yet.
              </AlertDescription>
            </Alert>
          )}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
