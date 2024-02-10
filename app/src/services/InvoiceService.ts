import {
  Timestamp,
  addDoc,
  collection,
  getFirestore,
} from 'firebase/firestore';

export type RawInvoice = {
  id: string;
  from: string;
  to: string;
  amount: number;
  provider: string;
  createdAt: Timestamp;
};

export function createInvoice(invoice: RawInvoice) {
  const db = getFirestore();
  const col = collection(db, 'invoices');

  const createdAt = new Date();

  return addDoc(col, Object.assign({ createdAt }, invoice));
}
