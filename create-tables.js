// Script to create tables in Airtable using the API
import 'dotenv/config';
import Airtable from 'airtable';
import fetch from 'node-fetch';

// Parse the base ID to make sure we have just the base ID part
const fullBaseId = process.env.AIRTABLE_BASE_ID;
const baseIdMatch = fullBaseId.match(/app[a-zA-Z0-9]+/);
const baseId = baseIdMatch ? baseIdMatch[0] : fullBaseId;

console.log(`Using Base ID: ${baseId}`);

// Airtable API base URL
const apiUrl = `https://api.airtable.com/v0/${baseId}`;

// Headers for API requests
const headers = {
  'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json'
};

// Function to create a record in a table
async function createRecord(tableName, fields) {
  try {
    const response = await fetch(`${apiUrl}/${tableName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fields })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create record in ${tableName}: ${error.error.message}`);
    }
    
    const data = await response.json();
    console.log(`Created record in ${tableName} with ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`Error creating record in ${tableName}:`, error.message);
    return null;
  }
}

// Create Users table and sample record
async function createUsersTable() {
  console.log('\nSetting up Users table...');
  const result = await createRecord('Users', {
    username: 'admin',
    password: 'password123',
    user_id: 1  // We'll use this as our application ID
  });
  
  if (result) {
    console.log('Users table setup complete ✅');
  }
}

// Create Deals table and sample record
async function createDealsTable() {
  console.log('\nSetting up Deals table...');
  const result = await createRecord('Deals', {
    deal_id: 1,  // We'll use this as our application ID
    referenceNumber: 'DEA-0001',
    dealName: 'Sample Deal',
    dealType: 'new_business',
    description: 'This is a sample deal to set up the table structure.',
    clientName: 'Sample Client',
    clientType: 'new',
    industry: 'technology',
    region: 'north_america',
    department: 'sales',
    status: 'pending',
    totalValue: 50000,
    contractTerm: 12,
    discountPercentage: 10,
    costPercentage: 60,
    expectedCloseDate: '2023-12-31'
  });
  
  if (result) {
    console.log('Deals table setup complete ✅');
  }
}

// Create Support Requests table and sample record
async function createSupportRequestsTable() {
  console.log('\nSetting up SupportRequests table...');
  const result = await createRecord('SupportRequests', {
    request_id: 1,  // We'll use this as our application ID
    supportType: 'pricing',
    requestTitle: 'Sample Support Request',
    description: 'This is a sample support request to set up the table structure.',
    status: 'submitted',
    relatedDealId: 1,
    priorityLevel: 'medium',
    deadline: '2023-12-15'
  });
  
  if (result) {
    console.log('SupportRequests table setup complete ✅');
  }
}

// Main function to set up all tables
async function setupTables() {
  try {
    console.log('Starting Airtable tables setup...');
    
    await createUsersTable();
    await createDealsTable();
    await createSupportRequestsTable();
    
    console.log('\nAirtable setup completed successfully! 🎉');
  } catch (error) {
    console.error('Error during setup:', error.message);
  }
}

// Run the setup
setupTables();