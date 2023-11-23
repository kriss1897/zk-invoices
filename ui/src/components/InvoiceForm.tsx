import { PrivateKey } from "o1js";
import { useState } from "react";

function useRandomInvoice() {
  const [invoice, setInvoice] = useState({
    from: PrivateKey.random().toPublicKey().toBase58().toString(),
    to: PrivateKey.random().toPublicKey().toBase58().toString(),
    amount: Math.floor(Math.random() * 1000),
  });

  function regenerate() {
    setInvoice({
      from: PrivateKey.random().toPublicKey().toBase58().toString(),
      to: PrivateKey.random().toPublicKey().toBase58().toString(),
      amount: Math.floor(Math.random() * 1000),
    });
  }

  return { invoice, regenerate };
}

export default function InvoiceForm({
  create,
}: {
  create: (data: any) => void;
}) {
  const { invoice, regenerate } = useRandomInvoice();

  return (
    <div>
      <h2 className="text-2xl mb-4">Invoices zkApp</h2>
      <small className="text-gray-400">
        For the purpose of this PoC, all the invoice data is generated randomly
      </small>
      <div>
        <div className="space-y-2 text-left">
          <label>From</label>
          <input
            id="invoice-from"
            className="w-full border bg-gray-50 rounded-md p-2"
            readOnly
            value={invoice.from}
          />
          <label>To</label>
          <input
            id="invoice-to"
            className="w-full border bg-gray-50 rounded-md p-2"
            readOnly
            value={invoice.to}
          />
          <label>Amount</label>
          <input
            id="invoice-amount"
            className="w-full border bg-gray-50 rounded-md p-2"
            readOnly
            value={invoice.amount}
          />
        </div>
        <button
          className="w-full py-2 bg-white text-slate-800 border rounded-md"
          onClick={regenerate}
        >
          Randomize
        </button>
        <button
          className="w-full py-2 bg-slate-800 text-white font-bold rounded-md"
          onClick={() => create(invoice)}
        >
          Create Invoice
        </button>
      </div>
    </div>
  );
}
