import { useEffect, useState } from "react";

type RawInvoice = {
  id: string;
  from: string;
  to: string;
  amount: number;
};

export default function InvoiceForm({
  create,
  initialValue
}: {
  create: (data: any) => void;
  initialValue: RawInvoice
}) {
  const [invoice, setInvoice] = useState(initialValue);

  function handleChange(name: any, value: any) {
    setInvoice({ [name]: value, ...invoice })
  }

  useEffect(() => {
    setInvoice(initialValue);
  }, [initialValue]);

  return (
    <div className="space-y-2">
        <div className="space-y-2 text-left">
          <label>From</label>
          <input
            id="invoice-from"
            name="from"
            className="w-full border bg-gray-50 rounded-md p-2"
            readOnly
            value={invoice.from}
          />
          <label>To</label>
          <input
            id="invoice-to"
            name="to"
            className="w-full border bg-gray-50 rounded-md p-2"
            value={invoice.to}
            onChange={(e) => handleChange('to', e.target.value)}
          />
          <label>Amount</label>
          <input
            id="invoice-amount"
            type="number"
            name="amount"
            className="w-full border bg-gray-50 rounded-md p-2"
            value={invoice.amount}
            onChange={(e) => handleChange('amount', Number(e.target.value))}
          />
        </div>
        <button
          className="w-full py-2 bg-slate-800 text-white font-bold rounded-md"
          onClick={() => create(invoice)}
        >
          Create Invoice
        </button>
      </div>
  );
}
