import { Fragment } from "react";
import { Transition, Dialog } from "@headlessui/react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import InvoiceForm from "./InvoiceForm";
import { useRandomInvoice } from "../utils/useRandomInvoice";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

type RawInvoice = {
  id: string;
  from: string;
  to: string;
  amount: number;
};

const InvoiceModal = NiceModal.create(() => {
  const modal = useModal();
  const { invoice, regenerate } = useRandomInvoice(modal.args?.from as string);

  function handleCreate(invoice: unknown) {
    console.log('x');

    modal.resolveHide({ invoice });
  }

  return (
    <Transition appear show={modal.visible} as={Fragment}>
      <Dialog as="div" className="relative z-8" onClose={modal.remove}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-16 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white px-6 py-8  text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h2"
                  className="text-2xl font-medium text-gray-900"
                >
                  Send Invoice
                  <Button variant="outline" className="float-right" onClick={regenerate}>
                    <RotateCcw />
                  </Button>
                </Dialog.Title>
                <Dialog.Description
                  as="p"
                  className="text-center px-8 mt-4 text-gray-400"
                ></Dialog.Description>
                <InvoiceForm create={handleCreate} initialValue={invoice as RawInvoice} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
});
  
export default InvoiceModal;