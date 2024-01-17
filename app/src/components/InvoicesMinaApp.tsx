import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, PublicKey, fetchAccount } from "o1js";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShortAddress } from "../utils/common";

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
  const zkAppHash = account?.zkapp?.appState[0].toString();
  const limit = account?.zkapp?.appState[3].toBigInt();
  const usage = account?.zkapp?.appState[4].toBigInt();

  useEffect(() => {
    fetchInvoicesAccount(address).then(({ account, error }) => {
      setAccount(account ? account : null);
    });
  }, []);

  if (account === undefined) {
    return <></>;
  }

  if (account !== null) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <ShortAddress address={zkAppHash} length={10} />
          <p>Total Limit: {Number(limit)}</p>
          <p>Total Usage: {Number(usage)}</p>
        </CardContent>
      </Card>
    );
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
