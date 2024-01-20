import { Fragment, useEffect, useState } from "react";
import { Transition, Dialog } from "@headlessui/react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Field, PublicKey, fetchAccount } from "o1js";
import { ShortAddress } from "../utils/common";
import { Loader } from "./Loader";

async function fetchInvoicesAccount(address: string) {
  const acc = await fetchAccount(
    {
      publicKey: PublicKey.fromBase58(address),
      tokenId: Field.from(import.meta.env.VITE_ZK_APP_TOKEN_ID),
    },
    import.meta.env.VITE_ZK_MINA_GRAPH
  );

  return acc;
}

const InvoiceAccountModal = NiceModal.create(() => {
  const modal = useModal();
  const [account, setAccount] = useState<any | undefined | null>();
  const zkAppHash = account?.zkapp?.appState[0].toString();
  const limit = account?.zkapp?.appState[3].toBigInt();
  const usage = account?.zkapp?.appState[4].toBigInt();

  useEffect(() => {
    fetchInvoicesAccount(modal.args?.address as string).then(({ account, error }) => {
      console.log(modal.args, account, error);

      setAccount(account ? account : null);
    });
  }, []);

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
                  Invoices Account
                </Dialog.Title>
                <Dialog.Description
                  as="p"
                  className="text-center px-8 mt-4 text-gray-400"
                ></Dialog.Description>
                { account === undefined ? <Loader/> : <div>
                <p>Total Limit: { limit && Number(limit) }</p>
                <p>Current Usage: { Number(usage).toString() }</p>
                <div>App Hash: { zkAppHash && <ShortAddress address={zkAppHash} length={5}/> } </div></div>}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
});
  
export default InvoiceAccountModal;