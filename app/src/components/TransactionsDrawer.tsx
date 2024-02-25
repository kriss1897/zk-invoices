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

function TextTimestamp({ date, label }: { date: Date; label: string }) {
  return (
    <>
      <small className="text-gray-400">{label}</small>
      <p>{date ? formatDistanceToNow(date, { addSuffix: true }) : 'Date Unavailable'}</p>
    </>
  );
}

const TransactionsDrawer = NiceModal.create(() => {
  const modal = useModal();
  const [transactions, setTransactions] = useState<any>([]);

  useEffect(() => {
    loadTxns();
  }, []);

  function loadTxns() {
    const txnsCountStr = localStorage.getItem('totalTxns'),
      txnsCount = txnsCountStr ? Number(txnsCountStr) : 0;

    const txns = Array(txnsCount)
      .fill(1)
      .map((x, idx) => {
        return {
          index: idx,
          data: JSON.parse(localStorage.getItem(`txn[${idx}]`) as string),
          hash: localStorage.getItem(`txn[${idx}][hash]`),
        };
      });

    setTransactions(txns);
  }

  function createNewInvoiceContent(data: any) {
    return (
      <div className="flex flex-row items-center">
        <div className="grow">
          <CardTitle>Create New Invoice</CardTitle>
          <TextTimestamp date={data.meta.createdAt} label="Created" />
        </div>
      </div>
    );
  }

  function createAccountContent(data: any) {
    return (
      <div className="flex flex-row items-center">
        <div className="grow">
          <CardTitle>Create New Account</CardTitle>
          <TextTimestamp date={data.meta.createdAt} label="Created" />
        </div>
      </div>
    );
  }

  function commitActionsContent(data: any) {
    return (
      <div className="flex flex-row items-center">
        <div className="grow">
          <CardTitle>Commit Actions</CardTitle>
          <TextTimestamp date={data.meta.createdAt} label="Created" />
        </div>
      </div>
    );
  }

  async function sendTransaction(data: any) {
    const index = data.idx;
    const fee = '';
    const memo = '';

    const payload = {
      transaction: data.txn,
      feePayer: {
        fee: fee,
        memo: memo,
      },
    };

    try {
      const { hash } = await (window as any).mina.sendTransaction(payload);

      localStorage.setItem(`txn[${index}][hash]`, hash);

      loadTxns();
    } catch (error: any) {
      console.log(error);
    }
  }

  return (
    <Drawer open={modal.visible} onClose={() => modal.hide()}>
      <DrawerContent onAbort={() => modal.remove()}>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle className="text-center">Transactions</DrawerTitle>
            {/* <DrawerDescription>All </DrawerDescription> */}
          </DrawerHeader>
          <div className="p-4 pb-0 space-y-4">
            {transactions.map(({ data, index, hash }: any) => {
              return (
                <Card key={hash}>
                  <CardContent className="pt-4 space-y-4">
                    {data.meta.task === CREATE_NEW_INVOICE &&
                      createNewInvoiceContent({ ...data, idx: index })}
                    {data.meta.task === MINT_ACCOUNT &&
                      createAccountContent({ ...data, idx: index })}
                    {data.meta.task === COMMIT_ACTIONS &&
                      commitActionsContent({ ...data, idx: index })}
                  </CardContent>
                  <CardFooter className="bg-slate-50 py-2">
                    <div className="flex flex-row w-full items-center">
                      <Badge variant="secondary">Not Committed</Badge>
                      <div className="flex-grow"></div>
                      <Button variant={hash ? 'link' : 'default'} onClick={() => sendTransaction({ ...data, idx: index })} >{hash ? 'Resend' : 'Send'}</Button>
                      {hash && <Button asChild variant="outline">
                        <a
                          target="_blank"
                          href={`https://minascan.io/berkeley/tx/${hash}/txInfo`}
                        >
                          View on Explorer
                        </a>
                      </Button> }
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
