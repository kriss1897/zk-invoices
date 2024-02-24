import NiceModal, { useModal } from '@ebay/nice-modal-react';

import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

import { Card, CardContent, CardFooter } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

const taskTitleMap: Record<string, string> = {
  'create-new-invoice': 'Create New Invoice',
  'commit-actions': 'Commit Actions',
  'mint-account': 'Create New Account'
}

const DUMMY_TXN = {
  data: {
    txn: {},
    meta: {
      task: 'create-new-invoice'
    },
  },
  hash: import.meta.env.VITE_SAMPLE_TXN
};

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

  return (
    <Drawer open={modal.visible} onClose={() => modal.hide()}>
      <DrawerContent onAbort={() => modal.remove()}>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle className="text-center">Transactions</DrawerTitle>
            {/* <DrawerDescription>All </DrawerDescription> */}
          </DrawerHeader>
          <div className="p-4 pb-0">
            {transactions.map(({ data, hash }: any) => {
              return <Card key={hash}>
              <CardContent className="pt-4">
                <div className="flex flex-row items-center">
                  <div className="grow">
                    { taskTitleMap[data.meta.task] }
                    {/* <small className="text-gray-400">Sent to</small> */}
                    {/* <small className="text-gray-400">Due Date</small> */}
                    {/* <p>{formatDistance(invoice.dueDate.toDate(), new Date(), { addSuffix: true })}</p> */}
                  </div>
                  {/* <div className="text-center align-middle text-xl font-medium">
            <p>Rs. {invoice.amount}</p>
          </div> */}
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 py-2">
                <div className="flex flex-row w-full items-center">
                  <Badge variant="secondary">Not Committed</Badge>
                  <div className="flex-grow"></div>
                  <Button asChild variant="outline"><a target='_blank' href={`https://minascan.io/berkeley/tx/${hash}/txInfo`}>View on Explorer</a></Button>
                </div>
              </CardFooter>
            </Card>
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
