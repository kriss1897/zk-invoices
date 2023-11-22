import { QuerySnapshot, collection, getFirestore, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

function ShortAddress({ address, length = 3 }: { address: string, length?: number }) {
  return <p>{address.slice(0, length)}...{address.slice(address.length - length)}</p>
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tree, setTree] = useState<any>();

  useEffect(() => {
    if (typeof window === 'undefined') {
      console.log('window object not present');

      return;
    }

    const o1js = import('o1js');
    const contracts =  import('../../../contracts/build/src');
    const db = getFirestore();

    function formatInvoicesSnapshot(snap: QuerySnapshot) {
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    };

    async function createInvoicesTree(invoices: any[]) {
      const { MerkleTree, PublicKey, UInt32, Bool, Field } = await o1js;
      const { Invoice } = await contracts;
      const tree = new MerkleTree(32);

      const emptyRoot = tree.getRoot();

      console.log(emptyRoot.toString());
  
      invoices.forEach((_invoice, index) => {
        const invoice = new Invoice({
          from: PublicKey.fromBase58(_invoice.from),
          to: PublicKey.fromBase58(_invoice.to),
          amount: UInt32.from(_invoice.amount),
          settled: Bool(false),
          // TODO: Add metadata hash later
          metadataHash: Field(0)
        })
    
        tree.setLeaf(BigInt(index), invoice.hash())
      });
    
      return tree;
    }

    onSnapshot(
      query(collection(db, 'invoices'), orderBy('createdAt', 'desc')),
      (snap) => {
        const invoices = formatInvoicesSnapshot(snap);
        
        createInvoicesTree(invoices).then(setTree);
        setInvoices(invoices);
      }
    );
  }, []);

  return <div className="space-y-4 max-w-2xl mx-auto">
    <h2 className="text-2xl">Invoices</h2>
    <small>Root: {tree?.getRoot().toString()}</small>
    { invoices.map((invoice, idx) => <div className="shadow-lg p-2 rounded-lg bg-white" key={`invoice:${invoice.id}`}>
        <div className="flex flex-row">
          <div className="grow">
            <small className="text-gray-400 mt-4">From</small>
            <ShortAddress address={invoice.from} length={5}/>
            <small className="text-gray-400 mt-4">To</small>
            <ShortAddress address={invoice.to} length={5}/>
          </div>
          <div className="w-32 text-center align-middle mt-8 text-xl font-medium">
            <p>Rs. {invoice.amount}</p>
          </div>
        </div>
      </div>
    )}
  </div>
}