const snowflake = require('snowflake-sdk');
const fs = require('fs');
const path = require('path');
const { createPrivateKey } = require('crypto');

// Load environment variables (you might need to use dotenv or another method)
const account = 'sw09563.us-east-1';
const username = 'donato.diferdinando@peopleconnect.us';
const privateKeyPath = '/Users/donato/Library/CloudStorage/OneDrive-PeopleConnect/Info/Security/rsa_key.p8';
const privateKeyPassphrase = 'SanDiego1#'; // Replace with actual passphrase
const role = 'SYSADMIN';
const warehouse = 'TABLEAU_WH';
const database = 'SANDBOX';
const schema = 'STRAT_OPS';

const loadPrivateKey = (path, passphrase) => {
  const keyData = fs.readFileSync(path, 'utf8');
  const privateKey = createPrivateKey({
    key: keyData,
    format: 'pem',
    type: 'pkcs8',
    passphrase: passphrase,
  });
  return privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
};

const privateKey = loadPrivateKey(privateKeyPath, privateKeyPassphrase);

const connection = snowflake.createConnection({
  account: account,
  username: username,
  privateKey: privateKey,
  role: role,
  warehouse: warehouse,
  database: database,
  schema: schema,
  logLevel: 'DEBUG', // Enable detailed logging
});

connection.connect((err, conn) => {
  if (err) {
    console.error('Unable to connect: ' + err.message);
  } else {
    console.log('Successfully connected to Snowflake.');
    conn.destroy();
  }
});