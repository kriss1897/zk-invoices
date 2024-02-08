// import * as Comlink from "comlink";
import {
  AccountUpdate,
  Bool,
  Field,
  MerkleTree,
  Mina,
  PublicKey,
  // MerkleTree,
  UInt32,
  fetchAccount,
} from "o1js";

import {
  Invoices,
  InvoicesProvider,
} from "../../contracts/build/src";

import { Invoice, InvoicesWitness } from '../../contracts/src/InvoicesModels';

import type { MinaCache } from "./cache";

const minaUrl = import.meta.env.VITE_ZK_MINA_GRAPH;
const archiveUrl = import.meta.env.VITE_ZK_MINA_ARCHIVE;

async function fetchFiles(type: string) {
  const { files } = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cache/discovery/${type}`).then(
    (res) => res.json()
  );

  return Promise.all(
    files.map((file: Record<string, string>) => {
      return Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/cache/${type}/${file.name}.header`).then(
          (res) => res.text()
        ),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/cache/${type}/${file.name}`).then((res) =>
          res.text()
        ),
      ]).then(([header, data]) => ({ file, header, data }));
    })
  ).then((cacheList) =>
    cacheList.reduce((acc: any, { file, header, data }) => {
      acc[file.name] = { file, header, data };

      return acc;
    }, {})
  );
}

const FileSystem = (files: any, onAccess: any): MinaCache => ({
  read({ persistentId, uniqueId, dataType }: any) {
    if (!files[persistentId]) {
      console.log("read");
      console.log({ persistentId, uniqueId, dataType });

      return undefined;
    }

    const currentId = files[persistentId].header;

    if (currentId !== uniqueId) {
      console.log("current id did not match persistent id");

      return undefined;
    }

    if (dataType === "string") {
      onAccess({ type: "hit", persistentId, uniqueId, dataType });

      return new TextEncoder().encode(files[persistentId].data);
    }
    // Due to the large size of prover keys, they will be compiled on the users machine.
    // This allows for a non blocking UX implementation.
    // else {
    //   let buffer = readFileSync(resolve(cacheDirectory, persistentId));
    //   return new Uint8Array(buffer.buffer);
    // }
    onAccess({ type: "miss", persistentId, uniqueId, dataType });

    return undefined;
  },
  write({ persistentId, uniqueId, dataType }: any) {
    console.log("write");
    console.log({ persistentId, uniqueId, dataType });
  },
  canWrite: true,
});

const network = Mina.Network({
  mina: minaUrl,
  archive: archiveUrl,
});
Mina.setActiveInstance(network);

await fetchAccount({ publicKey: zkAppAddress });

const zkApp = new InvoicesProvider(zkAppAddress);

addEventListener("message", (event: MessageEvent) => {
  console.log("worker event message", event.data);
  const { action, data } = event.data;

  if (action === "getCommitment") {
    // const commitment = zkApp.commitment.get().toString();
    // postMessage({
    //   type: 'response',
    //   action: 'getCommitment',
    //   data: { commitment }
    // });
  }

  if (action === "createInvoice") {
    const from = PublicKey.fromBase58(data.from);
    const to = PublicKey.fromBase58(data.to);
    const amount = UInt32.from(data.amount);

    createInvoice(from, to, amount).then((txn) => {
      postMessage({
        type: "response",
        action: "transaction",
        data: { txn },
      });
    });
  }

  if (action === "mint") {
    const address = data.address;

    mint(address).then((txn) => {
      postMessage({
        type: "response",
        action: "transaction",
        data: { txn },
      });
    });
  }
});

postStatusUpdate({ message: "Loading cached zkApp files" });
const providerCacheFiles = await fetchFiles("provider");
const cache = (files: any[]) => {
  return FileSystem(files, ({ type, persistentId }: any) => {
    if (type === "hit") {
      postStatusUpdate({
        message: `Found ${persistentId} in pre-built binaries`,
      });
    }

    if (type === "miss") {
      postStatusUpdate({ message: `Compiling ${persistentId}` });
    }
  });
}

postStatusUpdate({ message: "Initiated zkApp compilation process" });

await InvoicesProvider.compile({ cache: cache(providerCacheFiles) });

postMessage({
  type: "zkapp",
  action: "compiled",
});
console.log("compiled");
postStatusUpdate({ message: "" });

// const tree = new MerkleTree(32);

async function mint(senderKeyStr: string) {
  console.log("sending transaction", zkAppAddress);

  postStatusUpdate({
    message: `Now compiling invoices app`,
  });

  const invoicesCacheFiles = fetchFiles("invoices");
  await fetchAccount({ publicKey: PublicKey.fromBase58(senderKeyStr), tokenId: zkApp.token.id });
  
  const invoicesVkGenerated = await Invoices.compile({
    cache: cache(await invoicesCacheFiles),
  });

  postStatusUpdate({ message: 'Crafting transaction' });
  const sender = PublicKey.fromBase58(senderKeyStr);
  const fee = Number(0.1) * 1e9;
  const tree = new MerkleTree(32);

  await fetchAccount({ publicKey: zkAppAddress });
  const tx = await Mina.transaction({ sender: sender, fee }, () => {
    AccountUpdate.fundNewAccount(sender);
    zkApp.mint(sender, invoicesVkGenerated.verificationKey, tree.getRoot());
  });

  postStatusUpdate({ message: 'Creating transaction proof' });
  console.log("creating proof");
  await tx.prove();
  console.log("created proof");
  postStatusUpdate({ message: 'Sending transaction' });
  return tx.toJSON();
}

async function createInvoice(from: PublicKey, to: PublicKey, amount: UInt32) {
  console.log("sending transaction");
  const tree = new MerkleTree(16);
  await fetchAccount(
    { publicKey: zkAppAddress },
    minaUrl
  );

  const invoice = new Invoice({
    from,
    to,
    amount,
    metadataHash: Field(0),
    settled: Bool(false)
  });

  postStatusUpdate({ message: 'Crafting transaction' });
  const fee = Number(0.1) * 1e9;
  const tx = await Mina.transaction({ sender: from, fee }, () => {
    zkApp.createInvoice(from, invoice, new InvoicesWitness(tree.getWitness(0n)));
  });
  postStatusUpdate({ message: 'Creating transaction proof' });
  console.log("creating proof");
  await tx.prove();
  console.log("created proof");
  postStatusUpdate({ message: 'Sending transaction' });
  return tx.toJSON();
}

function postStatusUpdate({ message }: { message: string }) {
  postMessage({ type: "update", data: message });
}
