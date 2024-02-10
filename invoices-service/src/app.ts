import { readdir } from 'fs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { RequestHandler } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

// import config from './config';
import errorHandler from './middleware/errorHandler';
import fourOhFour from './middleware/fourOhFour';
import root from './routes/root';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import Client from 'mina-signer';
import path from 'path';
const client = new Client({ network: 'testnet' });

const app = express();

const firebaseApp = initializeApp({
  credential: applicationDefault(),
});

// Apply most middleware first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({}));

app.use(helmet());
app.use(morgan('tiny'));

// Apply routes before error handling
app.use('/', root);

app.get('/cache/discovery/invoices', (req, res) => {
  const invoicesCachePath = path.join(__dirname, '../../cache/invoicescache');

  return readdir(invoicesCachePath, (err, filesList) => {
    if (err) {
      return res
        .status(500)
        .json({ error: { message: 'Something went wrong' } });
    }

    const files = filesList
      .filter((file: string) => {
        return !file.endsWith('.header') && file.indexOf('-pk-') < 0;
      })
      .map((name) => {
        return { name, type: 'string' };
      });

    return res.json({ files });
  });
});

app.get('/cache/discovery/provider', (req, res) => {
  const providerCachePath = path.join(__dirname, '../../cache/providercache');

  return readdir(providerCachePath, (err, filesList) => {
    if (err) {
      return res
        .status(500)
        .json({ error: { message: 'Something went wrong' } });
    }

    const files = filesList
      .filter((file: string) => {
        return !file.endsWith('.header') && file.indexOf('-pk-') < 0;
      })
      .map((name) => {
        return { name, type: 'string' };
      });

    return res.json({ files });
  });
});

app.use(
  '/cache/invoices',
  express.static(path.join(__dirname, '../../cache/invoicescache'))
);
app.use(
  '/cache/provider',
  express.static(path.join(__dirname, '../../cache/providercache'))
);

const loginHandler: RequestHandler = async (req, res) => {
  const { data, publicKey, signature } = req.body;

  const validMessage = client.verifyMessage({ data, publicKey, signature });

  if (!validMessage) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const auth = getAuth(firebaseApp);

  const customToken = await auth.createCustomToken(publicKey);

  return res.json({ token: customToken });
};

app.post('/login', loginHandler);

// Apply error handling last
app.use(fourOhFour);
app.use(errorHandler);

export default app;
