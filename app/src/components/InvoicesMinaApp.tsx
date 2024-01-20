import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, PublicKey, fetchAccount } from "o1js";
import { useEffect, useState } from "react";

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

export default function InvoicesMinaApp({
  address,
  handleCreate,
}: {
  address: string;
  handleCreate: (address: string) => void;
}) {
  const [account, setAccount] = useState<any | undefined | null>();

  useEffect(() => {
    fetchInvoicesAccount(address).then(({ account, error }) => {
      setAccount(account ? account : null);
    });
  }, []);

  if (account === undefined) {
    return <></>;
  }

  if (account !== null) {
    return <></>
  }

  return (
    <Alert className="space-y-4">
      <AlertTitle>Welcome to zkInvoices</AlertTitle>
      <AlertDescription>
        Get started by registering a new account for zk invoices
      </AlertDescription>
      <Button onClick={() => handleCreate(address)}>Create new account</Button>
    </Alert>
  );
}
