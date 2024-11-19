import Head from 'next/head';
import { useState } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  // Example state to handle table data with 26 columns
  const [tableData, setTableData] = useState([
    Array(4).fill(''), // Row 1 with 26 columns
    Array(4).fill(''), // Row 2 with 26 columns
    Array(4).fill(''), // Row 3 with 26 columns
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (rowIndex, colIndex, value) => {
    const newData = [...tableData];
    newData[rowIndex][colIndex] = value;
    setTableData(newData);
  };

  // Function to handle appending data to Snowflake
  const appendDataToSnowflake = async () => {
    setIsLoading(true);
    setMessage('');

    const tableName = 'test';

    try {
      const response = await fetch('/api/appendToSnowflake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tableData, tableName }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Data successfully appended to Snowflake!');
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamically generate headers based on the number of columns
  const numberOfColumns = tableData[0].length;
  const headers = Array.from({ length: numberOfColumns }, (_, i) => `Column ${i + 1}`);

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App with Editable Table</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Scenario Planner
        </h1>

        <p className={styles.description}>
          Get started by editing <code>pages/index.js</code>
        </p>

        {/* Editable Table Section */}
        <section className={styles.tableSection}>
          <h2>Editable Table</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.editableTable}>
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex}>
                        <input
                          type="number"
                          step="1" // Change to "any" for floats if needed
                          value={cell}
                          onChange={(e) =>
                            handleInputChange(rowIndex, colIndex, e.target.value)
                          }
                          className={styles.tableInput}
                          aria-label={`Row ${rowIndex + 1} Column ${colIndex + 1}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Append Button Section */}
        <section className={styles.appendSection}>
          <button
            onClick={appendDataToSnowflake}
            className={styles.appendButton}
            disabled={isLoading}
          >
            {isLoading ? 'Appending...' : 'Append to Snowflake'}
          </button>
          {message && <p className={styles.message}>{message}</p>}
        </section>
      </main>

      <footer className={styles.footer}>
        {/* Footer content */}
      </footer>
    </div>
  );
}