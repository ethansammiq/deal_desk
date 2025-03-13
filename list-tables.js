// Script to list available tables in the Airtable base
import 'dotenv/config';
import Airtable from 'airtable';

// Configure Airtable
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID);

// Function to list available tables
async function listTables() {
  try {
    console.log('Attempting to connect to Airtable with:');
    console.log(`Base ID: ${process.env.AIRTABLE_BASE_ID}`);
    
    // Try to get metadata about the base
    const metadata = await base.tables();
    console.log('\nTables in this base:');
    metadata.forEach(table => {
      console.log(`- ${table.name} (ID: ${table.id})`);
      console.log('  Fields:');
      table.fields.forEach(field => {
        console.log(`  - ${field.name} (${field.type})`);
      });
      console.log('');
    });
  } catch (error) {
    console.error('Error connecting to Airtable:', error);
    console.log('\nIf you see a 404 error, this might mean:');
    console.log('1. The base ID is incorrect');
    console.log('2. The API key does not have access to this base');
    console.log('3. The base exists but has no tables yet');
  }
}

// Run the function
listTables();