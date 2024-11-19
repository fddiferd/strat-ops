// pages/api/testDecrypt.js

import fs from 'fs';
import path from 'path';
import { createPrivateKey } from 'crypto';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { privateKeyPath, passphrase } = req.body;

    if (!privateKeyPath || !passphrase) {
      return res.status(400).json({ error: 'privateKeyPath and passphrase are required.' });
    }

    try {
      const absolutePath = path.resolve(privateKeyPath);
      console.log('Loading private key from:', absolutePath);

      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Private key file not found at path: ${absolutePath}`);
      }

      const keyData = fs.readFileSync(absolutePath, 'utf8');
      console.log('Private key file read successfully.');

      const privateKey = createPrivateKey({
        key: keyData,
        format: 'pem',
        type: 'pkcs8',
        passphrase: passphrase,
      });

      console.log('Private key created successfully.');

      // Optionally, export to DER format if needed
      const privateKeyDer = privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64');

      return res.status(200).json({ message: 'Private key decrypted successfully.', privateKeyDer });
    } catch (error) {
      console.error('Error:', error.message);
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}