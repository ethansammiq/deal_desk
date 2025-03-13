// Script to set up Airtable tables with the required fields
import 'dotenv/config';
import Airtable from 'airtable';

// Configure Airtable
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID);

async function setupTables() {
  try {
    console.log('Starting Airtable setup...');
    
    // Setup Users table
    console.log('Setting up Users table...');
    await setupUsersTable();
    
    // Setup Deals table
    console.log('Setting up Deals table...');
    await setupDealsTable();
    
    // Setup Support Requests table
    console.log('Setting up SupportRequests table...');
    await setupSupportRequestsTable();
    
    console.log('Airtable setup completed successfully!');
  } catch (error) {
    console.error('Error setting up Airtable:', error);
  }
}

async function setupUsersTable() {
  // Create a sample user to ensure fields are created
  await base('Users').create({
    id: 1,
    username: 'admin',
    password: 'password123'
  });
  
  console.log('Users table setup complete');
}

async function setupDealsTable() {
  // Create a sample deal to ensure fields are created
  await base('Deals').create({
    id: 1,
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
  
  console.log('Deals table setup complete');
}

async function setupSupportRequestsTable() {
  // Create a sample support request to ensure fields are created
  await base('SupportRequests').create({
    id: 1,
    supportType: 'pricing',
    requestTitle: 'Sample Support Request',
    description: 'This is a sample support request to set up the table structure.',
    status: 'submitted',
    relatedDealId: 1,
    priorityLevel: 'medium',
    deadline: '2023-12-15'
  });
  
  console.log('SupportRequests table setup complete');
}

// Run the setup
setupTables();