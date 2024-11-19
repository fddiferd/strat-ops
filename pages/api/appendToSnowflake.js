import snowflake from 'snowflake-sdk';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { tableData, tableName } = req.body;

    // Validate tableData
    if (!tableData || !Array.isArray(tableData)) {
      return res.status(400).json({ error: 'Invalid table data. Expected an array of rows.' });
    }

    // Validate tableName
    if (!tableName || typeof tableName !== 'string') {
      return res.status(400).json({ error: 'Invalid table name. Expected a string.' });
    }

    let connection;

    try {
      // Initialize and connect
      connection = initializeSnowflakeConnection();
      await connect(connection);

      // Prepare the INSERT statement
      const numberOfColumns = 4;
      const columnNames = ['a', 'b', 'c', 'd'];
      const placeholders = Array(numberOfColumns).fill('?').join(', ');
      const insertQuery = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${placeholders})`;

      // Execute the INSERT statement for each row
      for (let row of tableData) {
        // Validate row length
        if (!Array.isArray(row) || row.length !== numberOfColumns) {
          throw new Error('Each row must be an array with exactly 4 elements.');
        }

        // Convert all cell values to appropriate types (e.g., numbers)
        const formattedRow = row.map(cell => {
          const num = parseFloat(cell);
          return isNaN(num) ? null : num;
        });

        await executeQuery(connection, insertQuery, formattedRow);
      }

      // Close the connection
      connection.destroy((err, conn) => {
        if (err) {
          console.error('Unable to disconnect:', err.message);
        } else {
          console.log('Disconnected from Snowflake.');
        }
      });

      return res.status(200).json({ message: 'Data appended successfully.' });
    } catch (error) {
      console.error('Error appending data to Snowflake:', error);

      // Attempt to disconnect if connected
      if (connection && connection.isUp()) {
        connection.destroy((err, conn) => {
          if (err) {
            console.error('Unable to disconnect after error:', err.message);
          } else {
            console.log('Disconnected from Snowflake after error.');
          }
        });
      }

      return res.status(500).json({ error: 'Failed to append data to Snowflake.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Helper Functions

const loadPrivateKey = (privateKeyPath) => {
  try {
    const absolutePath = path.resolve(privateKeyPath);
    console.log('Attempting to load private key from:', absolutePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Private key file not found at path: ${absolutePath}`);
    }

    const keyData = fs.readFileSync(absolutePath, 'utf8');
    console.log('Private key file read successfully.');

    return keyData; // PEM string
  } catch (error) {
    console.error('Error loading private key:', error);
    throw error;
  }
};

const initializeSnowflakeConnection = () => {
  const privateKeyPath = process.env.SNOWFLAKE_PRIVATE_KEY_PATH;
  const privateKeyPassphrase = process.env.SNOWFLAKE_PRIVATE_KEY_PASSPHRASE;

  console.log('Initializing Snowflake connection with the following parameters:');
  console.log('Account:', process.env.SNOWFLAKE_ACCOUNT);
  console.log('User:', process.env.SNOWFLAKE_USER);
  console.log('Role:', process.env.SNOWFLAKE_ROLE);
  console.log('Warehouse:', process.env.SNOWFLAKE_WAREHOUSE);
  console.log('Database:', process.env.SNOWFLAKE_DATABASE);
  console.log('Schema:', process.env.SNOWFLAKE_SCHEMA);

  if (!privateKeyPath || !privateKeyPassphrase) {
    throw new Error('Missing Snowflake private key path or passphrase in environment variables.');
  }

  const privateKey = loadPrivateKey(privateKeyPath);

  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USER,
    password: process.env.SNOWFLAKE_PASSWORD, // Use password instead of private key
    role: process.env.SNOWFLAKE_ROLE,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA,
  });

  return connection;
};

const connect = (connection) => {
  return new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        console.error('Unable to connect to Snowflake:', err.message);
        reject(err);
      } else {
        console.log('Successfully connected to Snowflake.');
        resolve(conn);
      }
    });
  });
};

const executeQuery = (connection, query, binds = []) => {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: query,
      binds: binds,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error('Failed to execute statement:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      },
    });
  });
};