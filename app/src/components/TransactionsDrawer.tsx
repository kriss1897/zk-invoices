import NiceModal, { useModal } from '@ebay/nice-modal-react';

import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const CREATE_NEW_INVOICE = 'create-new-invoice';
const COMMIT_ACTIONS = 'commit-actions';
const MINT_ACCOUNT = 'mint-account';

const DUMMY_TXN = {
  data: {
    txn: {},
    meta: {
      task: 'create-new-invoice',
    },
    createdAt: new Date(),
  },
  hash: import.meta.env.VITE_SAMPLE_TXN,
};

function TextTimestamp({ date, label }: { date: Date; label: string }) {
  return (
    <>
      <small className="text-gray-400">{label}</small>
      <p>{formatDistanceToNow(date, { addSuffix: true })}</p>
    </>
  );
}

const TransactionsDrawer = NiceModal.create(() => {
  const modal = useModal();
  const [transactions, setTransactions] = useState<any>([]);

  useEffect(() => {
    const txnsCountStr = localStorage.getItem('totalTxns'),
      txnsCount = txnsCountStr ? Number(txnsCountStr) : 0;

    const txns = Array(txnsCount)
      .fill(1)
      .map((x, idx) => {
        return {
          data: localStorage.getItem(`txn[${idx}]`),
          hash: localStorage.getItem(`txn[${idx}][hash]`),
        };
      });

    console.log(txns);

    setTransactions([DUMMY_TXN]);
  }, []);

  function createNewInvoiceContent(data: any) {
    return (
      <div className="flex flex-row items-center">
        <div className="grow">
          <CardTitle>Create New Invoice</CardTitle>
          <TextTimestamp date={data.createdAt} label="Created" />
        </div>
        <div className="text-center align-middle text-xl font-medium">
          <Button variant="link">Retry</Button>
        </div>
      </div>
    );
  }

  function createAccountContent(data: any) {
    return (
      <div className="flex flex-row items-center">
        <div className="grow">
          <CardTitle>Create New Account</CardTitle>
          <TextTimestamp date={data.createdAt} label="Created" />
        </div>
        <div className="text-center align-middle text-xl font-medium">
          <Button variant="link">Retry</Button>
        </div>
      </div>
    );
  }

  function commitActionsContent(data: any) {
    return (
      <div className="flex flex-row items-center">
        <div className="grow">
          <CardTitle>Commit Actions</CardTitle>
          <TextTimestamp date={data.createdAt} label="Created" />
        </div>
        <div className="text-center align-middle text-xl font-medium">
          <Button variant="link">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <Drawer open={modal.visible} onClose={() => modal.hide()}>
      <DrawerContent onAbort={() => modal.remove()}>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle className="text-center">Transactions</DrawerTitle>
            {/* <DrawerDescription>All </DrawerDescription> */}
          </DrawerHeader>
          <div className="p-4 pb-0">
            {transactions.map(({ data, hash }: any) => {
              return (
                <Card key={hash}>
                  <CardContent className="pt-4 space-y-4">
                    {data.meta.task === CREATE_NEW_INVOICE &&
                      createNewInvoiceContent(data)}
                    {data.meta.task === MINT_ACCOUNT &&
                      createAccountContent(data)}
                    {data.meta.task === COMMIT_ACTIONS &&
                      commitActionsContent(data)}
                  </CardContent>
                  <CardFooter className="bg-slate-50 py-2">
                    <div className="flex flex-row w-full items-center">
                      <Badge variant="secondary">Not Committed</Badge>
                      <div className="flex-grow"></div>
                      <Button asChild variant="outline">
                        <a
                          target="_blank"
                          href={`https://minascan.io/berkeley/tx/${hash}/txInfo`}
                        >
                          View on Explorer
                        </a>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          <DrawerFooter>
            <Button variant="outline" onClick={() => modal.remove()}>
              Back
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
});

export default TransactionsDrawer;
