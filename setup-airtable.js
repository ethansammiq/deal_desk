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
  try {
    // Create a sample user to ensure fields are created
    await base('Users').create({
      "Name": "Admin User", // Primary field for Airtable
      "internal_id": 1,
      "username": "admin",
      "password": "password123"
    });
    
    console.log('Users table setup complete');
  } catch (error) {
    console.error('Error setting up Users table:', error.message);
    // If the record already exists, it's okay to continue
    if (!error.message.includes('DUPLICATE_OR_INVALID_VALUE')) {
      throw error;
    }
  }
}

async function setupDealsTable() {
  try {
    // Create a sample deal to ensure all fields are created
    await base('Deals').create({
      "Name": "Sample Deal", // Primary field for Airtable
      "internal_id": 1,
      "dealName": "Sample Deal",
      "dealType": "new_business",
      "description": "This is a sample deal to set up the table structure.",
      "department": "sales",
      "expectedCloseDate": "2023-12-31",
      "priority": "medium",
      "clientName": "Sample Client",
      "clientType": "new",
      "industry": "technology",
      "region": "north_america",
      "companySize": "medium",
      "totalValue": 50000,
      "contractTerm": 12,
      "paymentTerms": "monthly",
      "discountPercentage": 10,
      "costPercentage": 60,
      "incentivePercentage": 0,
      "previousYearValue": 0,
      "renewalOption": "manual",
      "pricingNotes": "Sample pricing notes",
      "status": "pending",
      "createdAt": new Date().toISOString(),
      "updatedAt": new Date().toISOString(),
      "referenceNumber": "DEA-0001"
    });
    
    console.log('Deals table setup complete');
  } catch (error) {
    console.error('Error setting up Deals table:', error.message);
    // If the record already exists, it's okay to continue
    if (!error.message.includes('DUPLICATE_OR_INVALID_VALUE')) {
      throw error;
    }
  }
}

async function setupSupportRequestsTable() {
  try {
    // Create a sample support request to ensure all fields are created
    await base('SupportRequests').create({
      "Name": "Sample Support Request", // Primary field for Airtable
      "internal_id": 1,
      "supportType": "pricing",
      "requestTitle": "Sample Support Request",
      "description": "This is a sample support request to set up the table structure.",
      "relatedDealId": 1,
      "priorityLevel": "medium",
      "deadline": "2023-12-15",
      "status": "submitted",
      "createdAt": new Date().toISOString(),
      "updatedAt": new Date().toISOString()
    });
    
    console.log('SupportRequests table setup complete');
  } catch (error) {
    console.error('Error setting up SupportRequests table:', error.message);
    // If the record already exists, it's okay to continue
    if (!error.message.includes('DUPLICATE_OR_INVALID_VALUE')) {
      throw error;
    }
  }
}

// Run the setup
setupTables();