import { useContext, useEffect, useState } from "react";
import {
  Firestore,
  QuerySnapshot,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";

import { PublicKey, UInt32, Bool, Field } from "o1js";

import { Invoice } from "../../../contracts/src/InvoicesModels";
import { User, getAuth } from "firebase/auth";
import UserContext from "../context/UserContext";
import { Button } from "@/components/ui/button";

const treeModule = import("../../../contracts/build/src/tree");

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

class FirebaseStore {
  private nodes: Record<number, Record<string, Field>> = {};
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
  }

  /**
   * Returns a node which lives at a given index and level.
   * @param level Level of the node.
   * @param index Index of the node.
   * @returns The data of the node.
   */
  async getNode(level: number, index: bigint, _default: Field): Promise<Field> {
    const node = await getDoc(
      doc(this.db, `tree/${level}:${index.toString()}`)
    );

    if (node.exists()) {
      return Field.from(node.get("data"));
    }

    return _default;
  }

  // TODO: this allows to set a node at an index larger than the size. OK?
  async setNode(level: number, index: bigint, value: Field) {
    await setDoc(doc(this.db, `tree/${level}:${index.toString()}`), {
      data: value.toString(),
    });

    return ((this.nodes[level] ??= {})[index.toString()] = value);
  }
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tree, setTree] = useState<any>();
  const [treeRoot, setTreeRoot] = useState<string>("");
  const { user } = useContext(UserContext);

  useEffect(() => {
    const db = getFirestore();
    const userId = (user as User).uid;

    function formatInvoicesSnapshot(snap: QuerySnapshot) {
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    async function createInvoicesTree(invoices: any[]) {
      const { PersistentMerkleTree } = await treeModule;

      const store = new FirebaseStore();
      const tree = new PersistentMerkleTree(32, store);

      invoices.forEach((_invoice, index) => {
        const invoice = new Invoice({
          from: PublicKey.fromBase58(user?.uid as string),
          to: PublicKey.fromBase58(_invoice.to),
          amount: UInt32.from(_invoice.amount),
          settled: Bool(false),
          // TODO: Add metadata hash later
          metadataHash: Field(0),
        });

        tree.setLeaf(BigInt(index), invoice.hash());
      });

      return tree;
    }

    onSnapshot(
      query(
        collection(db, "invoices"),
        where("from", "==", userId),
        orderBy("createdAt", "desc")
      ),
      (snap) => {
        const invoices = formatInvoicesSnapshot(snap);

        createInvoicesTree(invoices).then(setTree);
        setInvoices(invoices);
      }
    );
  }, []);

  useEffect(() => {
    if (!tree) {
      return;
    }

    tree.getRoot().then((root: any) => setTreeRoot(root.toString()));
  }, [tree]);

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
