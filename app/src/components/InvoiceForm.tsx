import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { RawInvoice } from '../services/InvoiceService';

export default function InvoiceForm({
  create,
  initialValue,
}: {
  create: (data: any) => void;
  initialValue: RawInvoice;
}) {
  const currentDate = new Date();
  const [invoice, setInvoice] = useState(initialValue);
  const [date, setDate] = useState<Date | undefined>(currentDate);

  function handleChange(name: any, value: any) {
    setInvoice({ ...invoice, [name]: value });
  }

  useEffect(() => {
    setInvoice(initialValue);
  }, [initialValue]);

  return (
    <div className="space-y-4">
      <div className="space-y-4 text-left grid grid-cols-2 gap-4">
        <div className='col-span-2'>
          <label className="text-sm">To</label>
          <input
            id="invoice-to"
            name="to"
            className="w-full border bg-gray-50 rounded-md p-2"
            value={invoice.to}
            onChange={(e) => handleChange('to', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm">Amount</label>
          <input
            id="invoice-amount"
            type="number"
            name="amount"
            className="w-full border bg-gray-50 rounded-md p-2"
            value={invoice.amount}
            onChange={(e) => handleChange('amount', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-sm">Due Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <div
                className={cn(
                  'w-full justify-start text-left font-normal border bg-gray-50 rounded-md p-2 cursor-pointer',
                  !date && 'text-muted-foreground'
                )}
              >
                <div>
                  <CalendarIcon className="mr-2 h-4 w-4 inline mb-1" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  d && d > currentDate && setDate(d)
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <button
        className="w-full py-2 bg-slate-800 text-white font-bold rounded-md"
        onClick={() => create({ ...invoice, dueDate: date })}
      >
        Create Invoice
      </button>
    </div>
  );
}
