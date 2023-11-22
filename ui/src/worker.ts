// import * as Comlink from "comlink";
import {
  Mina,
  PublicKey,
  MerkleTree,
  UInt32,
  Bool,
  Field,
  fetchAccount,
} from "o1js";
import { Invoice, Invoices, InvoicesWitness } from "../../contracts/build/src/";
import type { MinaCache } from "./cache";

// Update this to use the address (public key) for your zkApp account.
// const zkAppAddress = 'B62qoHpnsCCsnhqkiv9nZXmxxvWjKBWqTKhh1baqKim25e4aiUePw7H';
const zkAppAddress = 'B62qmUQ7bpqVr4P3gj7RbmNmEdnA892NqwSJcmxgN6xMDVamiXQgAy8';
const minaUrl = "https://proxy.berkeley.minaexplorer.com/graphql";
const archiveUrl = "https://archive.berkeley.minaexplorer.com";

// const minaUrl = 'https://api.minascan.io/node/berkeley/v1/graphql';
// const archiveUrl = 'https://api.minascan.io/archive/berkeley/v1/graphql/';
const files = [
  { name: "srs-fp-65536", type: "string" },
  { name: "srs-fq-32768", type: "string" },
  { name: "step-vk-invoices-commit", type: "string" },
  { name: "step-vk-invoices-settleinvoice", type: "string" },
  { name: "step-vk-invoices-createinvoice", type: "string" },
  { name: "step-vk-invoices-init", type: "string" },
  { name: "wrap-vk-invoices", type: "string" },
  { name: "lagrange-basis-fp-1024", type: "string" },
  { name: "lagrange-basis-fp-32768", type: "string" },
  { name: "lagrange-basis-fp-65536", type: "string" },
];

function fetchFiles() {
  return Promise.all(
    files.map((file) => {
      return Promise.all([
        fetch(`http://localhost:3000/nftcache/${file.name}.header`).then(
          (res) => res.text()
        ),
        fetch(`http://localhost:3000/nftcache/${file.name}`).then((res) =>
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
      // read current uniqueId, return data if it matches
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
        onAccess({ type: 'hit', persistentId, uniqueId, dataType });

        return new TextEncoder().encode(files[persistentId].data);
      }
      // Due to the large size of prover keys, they will be compiled on the users machine.
      // This allows for a non blocking UX implementation.
      // else {
      //   let buffer = readFileSync(resolve(cacheDirectory, persistentId));
      //   return new Uint8Array(buffer.buffer);
      // }
      onAccess({ type: 'miss', persistentId, uniqueId, dataType });

      return undefined;
    },
    write({ persistentId, uniqueId, dataType }: any, data: any) {
      console.log("write");
      console.log({ persistentId, uniqueId, dataType });
    },
    canWrite: true
});

const network = Mina.Network({
  mina: minaUrl,
  archive: archiveUrl,
});
Mina.setActiveInstance(network);

await fetchAccount(
  { publicKey: zkAppAddress },
  minaUrl
);

const zkApp = new Invoices(PublicKey.fromBase58(zkAppAddress));

addEventListener("message", (event: MessageEvent) => {
  console.log("worker event message", event.data);
  const { action, data } = event.data;

  if (action === 'getCommitment') {
    const commitment = zkApp.commitment.get().toString();

    postMessage({
      type: 'response',
      action: 'getCommitment',
      data: { commitment }
    });
  }

  if (action === 'createInvoice') {
    const from = PublicKey.fromBase58(data.from);
    const to = PublicKey.fromBase58(data.to);
    const amount = UInt32.from(data.amount);

    createInvoice(from, to, amount).then((txn) => {
      postMessage({
        type: 'response',
        action: 'transaction',
        data: { txn }
      });
    }); 
  }

  if (action === 'commit') {
    commit().then((txn) => {
      postMessage({
        type: 'response',
        action: 'transaction',
        data: { txn }
      });
    }); 
  }
});

postStatusUpdate({ message: 'Loading cached zkApp files' });
const cacheFiles = await fetchFiles();
const cache = FileSystem(cacheFiles, ({ type, persistentId, uniqueId, dataType }: any) => {
  if (type === 'hit') {
    postStatusUpdate({ message: `Found ${persistentId} in pre-built binaries` });
  }

  if (type === 'miss') {
    postStatusUpdate({ message: `Compiling ${persistentId}` });
  }
})

postStatusUpdate({ message: 'Initiated zkApp compilation process' });
await Invoices.compile({ cache });
postMessage({
  type: 'zkapp',
  action: 'compiled'
});
postStatusUpdate({ message: '' });

const tree = new MerkleTree(32);

async function commit() {
  console.log("sending transaction");

  await fetchAccount(
    { publicKey: zkAppAddress },
    minaUrl
  );

  postStatusUpdate({ message: 'Crafting transaction' });
  const sender = PublicKey.fromBase58('B62qqgbzVWR7MVQyL8M3chhKXScVGD4HZxrcZoViSqroDCzC4Qd68Yh');
  const fee = Number(0.1) * 1e9;
  const tx = await Mina.transaction({ sender: sender, fee }, () => {
    zkApp.commit();
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
  console.log("tree root", tree.getRoot().toString());
  const account = PublicKey.fromBase58(
    "B62qqgbzVWR7MVQyL8M3chhKXScVGD4HZxrcZoViSqroDCzC4Qd68Yh"
  );

  await fetchAccount(
    { publicKey: zkAppAddress },
    minaUrl
  );

  const invoice = new Invoice({
    from,
    to,
    amount,
    settled: Bool(false),
    metadataHash: Field(0),
  });

  postStatusUpdate({ message: 'Crafting transaction' });
  const sender = PublicKey.fromBase58('B62qqgbzVWR7MVQyL8M3chhKXScVGD4HZxrcZoViSqroDCzC4Qd68Yh');
  const fee = Number(0.1) * 1e9;
  const tx = await Mina.transaction({ sender: sender, fee }, () => {
    zkApp.createInvoice(invoice, new InvoicesWitness(tree.getWitness(0n)));
  });
  postStatusUpdate({ message: 'Creating transaction proof' });
  console.log("creating proof");
  await tx.prove();
  console.log("created proof");
  postStatusUpdate({ message: 'Sending transaction' });

  return tx.toJSON();
}

function postStatusUpdate({ message }: { message: string }) {
  postMessage({ type: 'update', data: message });
}