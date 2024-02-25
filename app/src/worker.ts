import { PublicKey, UInt32 } from 'o1js';
import type { MinaCache } from './cache';
import { Timestamp } from 'firebase/firestore';

const minaUrl = import.meta.env.VITE_ZK_MINA_GRAPH;
const archiveUrl = import.meta.env.VITE_ZK_MINA_ARCHIVE;

async function fetchFiles(type: string) {
  const { files } = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/cache/discovery/${type}`
  ).then((res) => res.json());

  return Promise.all(
    files.map((file: Record<string, string>) => {
      return Promise.all([
        fetch(
          `${import.meta.env.VITE_API_BASE_URL}/cache/${type}/${file.name}.header`
        ).then((res) => res.text()),
        fetch(
          `${import.meta.env.VITE_API_BASE_URL}/cache/${type}/${file.name}`
        ).then((res) => res.text()),
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
      console.log('read');
      console.log({ persistentId, uniqueId, dataType });

      return undefined;
    }

    const currentId = files[persistentId].header;

    if (currentId !== uniqueId) {
      console.log('current id did not match persistent id');

      return undefined;
    }

    if (dataType === 'string') {
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
  write({ persistentId, uniqueId, dataType }: any) {
    console.log('write');
    console.log({ persistentId, uniqueId, dataType });
  },
  canWrite: true,
});

async function main() {
  const { AccountUpdate, Bool, Field, MerkleTree, Mina, fetchAccount } =
    await import('o1js');

  const zkAppAddress = PublicKey.fromBase58(
    import.meta.env.VITE_ZK_APP_ADDRESS
  );

  const { Invoices, InvoicesProvider } = await import(
    '../../contracts/build/src'
  );

  const { Invoice, InvoicesWitness } = await import(
    '../../contracts/src/InvoicesModels'
  );

  const network = Mina.Network({
    mina: minaUrl,
    archive: archiveUrl,
  });
  Mina.setActiveInstance(network);

  await fetchAccount({ publicKey: zkAppAddress });

  const zkApp = new InvoicesProvider(zkAppAddress);
  const compileInvoices = (function invoicesCompiler() {
    let compiled: Promise<any> | undefined;

    return async () => {
      if (compiled) {
        return compiled;
      }

      const invoicesCacheFiles = fetchFiles('invoices');

      console.log('compile zkapp');
      compiled = Invoices.compile({
        cache: cache(await invoicesCacheFiles),
      });

      compiled.then(() => {
        console.log('compile zkapp: done')
      });

      return compiled;
    };
  })();

  addEventListener('message', (event: MessageEvent) => {
    console.log('worker event message', event.data);
    const { action, data } = event.data;
    let pendingTxn;

    if (action === 'createInvoice') {
      const from = PublicKey.fromBase58(data.from);
      const to = PublicKey.fromBase58(data.to);
      const amount = UInt32.from(data.amount);
      const id = data.id;
      const dueDateTimestamp = new Timestamp(data.dueDate.seconds, data.dueDate.nanoseconds);
      const dueDate = UInt32.from(Math.floor(dueDateTimestamp.toDate().valueOf() / 1000));

      console.log(Math.floor(dueDateTimestamp.toDate().valueOf() / 1000));

      pendingTxn = createInvoice(id, dueDate, from, to, amount);
    }

    if (action === 'mint') {
      const address = PublicKey.fromBase58(data.address);

      pendingTxn = mint(address);
    }

    if (action === 'commit') {
      const address = PublicKey.fromBase58(data.address);

      pendingTxn = commit(address);
    }

    pendingTxn &&
      pendingTxn.then(({ txn, meta }) => {
        postMessage({
          type: 'response',
          action: 'transaction',
          data: { txn, meta },
        });
      });
  });

  postStatusUpdate({ message: 'Loading cached zkApp files' });
  const providerCacheFiles = await fetchFiles('provider');
  const cache = (files: any[]) => {
    return FileSystem(files, ({ type, persistentId }: any) => {
      if (type === 'hit') {
        postStatusUpdate({
          message: `Found ${persistentId} in pre-built binaries`,
        });
      }

      if (type === 'miss') {
        postStatusUpdate({ message: `Compiling ${persistentId}` });
      }
    });
  };

  postStatusUpdate({ message: 'Initiated zkApp compilation process' });

  await InvoicesProvider.compile({ cache: cache(providerCacheFiles) });

  postMessage({
    type: 'zkapp',
    action: 'compiled',
  });
  console.log('compiled');
  postStatusUpdate({ message: '' });

  async function mint(senderAddress: PublicKey) {
    console.log('sending transaction', zkAppAddress);

    postStatusUpdate({
      message: `Now compiling invoices app`,
    });

    const invoicesVkGenerated = await compileInvoices();

    const zkAppData = await fetchAccount(
      {
        publicKey: zkAppAddress,
      },
      minaUrl
    );

    console.log('app state', zkAppData.account?.zkapp?.appState[0].toString());

    await fetchAccount({
      publicKey: senderAddress,
      tokenId: zkApp.token.id,
    });

    await fetchAccount({
      publicKey: senderAddress,
    });


    postStatusUpdate({ message: 'Crafting transaction' });
    const fee = Number(0.1) * 1e9;
    const tree = new MerkleTree(32);

    await fetchAccount({ publicKey: zkAppAddress });
    const tx = await Mina.transaction({ sender: senderAddress, fee }, () => {
      AccountUpdate.fundNewAccount(senderAddress);
      zkApp.mint(senderAddress, invoicesVkGenerated.verificationKey, tree.getRoot());
    });

    postStatusUpdate({ message: 'Creating transaction proof' });
    console.log('creating proof');
    await tx.prove();
    console.log('created proof');
    postStatusUpdate({ message: 'Sending transaction' });

    return {
      txn: tx.toJSON(),
      meta: {
        task: 'mint-account',
        createdAt: new Date(),
        args: {
          sender: senderAddress.toBase58(),
        },
      },
    };
  }

  async function createInvoice(
    id: string,
    dueDate: UInt32,
    from: PublicKey,
    to: PublicKey,
    amount: UInt32
  ) {
    await compileInvoices();
    const tree = new MerkleTree(32);

    const invoice = new Invoice({
      id: Field.from(id),
      dueDate: dueDate,
      from,
      to,
      amount,
      metadataHash: Field(0),
      settled: Bool(false),
    });

    postStatusUpdate({ message: 'Crafting transaction' });
    const fee = Number(0.1) * 1e9;

    const userInvoicesApp = new Invoices(from, zkApp.token.id);

    await fetchAccount(
      {
        publicKey: from,
      },
      minaUrl
    );

    await fetchAccount(
      {
        publicKey: from,
        tokenId: zkApp.token.id,
      },
      minaUrl
    );

    const tx = await Mina.transaction({ sender: from, fee }, () => {
      userInvoicesApp.createInvoice(
        invoice,
        new InvoicesWitness(tree.getWitness(0n))
      );

      zkApp.approveAccountUpdate(userInvoicesApp.self);
    });

    postStatusUpdate({ message: 'Creating transaction proof' });
    console.log('creating proof');
    await tx.prove();
    console.log('created proof');
    postStatusUpdate({ message: 'Sending transaction' });

    return {
      txn: tx.toJSON(),
      meta: {
        task: 'create-new-invoice',
        createdAt: new Date(),
        args: {
          id: id.toString(),
          dueDate: new Date(Number(dueDate.toBigint()) * 1000),
          from: from.toBase58(),
          to: to.toBase58(),
          amount: amount.toString(),
        },
      },
    };
  }

  async function commit(from: PublicKey) {
    console.log('commit: compile invoices zkapp')
    await compileInvoices();
    console.log('commit: compiled zkapp')

    postStatusUpdate({ message: 'Crafting transaction' });
    const fee = Number(0.1) * 1e9;

    const userInvoicesApp = new Invoices(from, zkApp.token.id);
    await fetchAccount({ publicKey: zkAppAddress }, minaUrl);
    await fetchAccount({ publicKey: from }, minaUrl );
    await fetchAccount(
      {
        publicKey: from,
        tokenId: zkApp.token.id,
      },
      minaUrl
    );

    const tx = await Mina.transaction({ sender: from, fee }, () => {
      userInvoicesApp.commit();

      zkApp.approveAccountUpdate(userInvoicesApp.self);
    });

    postStatusUpdate({ message: 'Creating transaction proof' });
    console.log('creating proof');
    await tx.prove();
    console.log('created proof');
    postStatusUpdate({ message: 'Sending transaction' });

    return {
      txn: tx.toJSON(),
      meta: {
        task: 'commit-actions',
        createdAt: new Date(),
        args: {
          sender: from.toBase58(),
        },
      },
    };
  }

  function postStatusUpdate({ message }: { message: string }) {
    postMessage({ type: 'update', data: message });
  }
}

main().catch(console.error);
