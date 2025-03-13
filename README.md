# Deal Desk Application

A comprehensive deal desk application for submitting commercial deals for approval, requesting support, and tracking deal status.

## Features

- Dashboard with deal statistics and overview
- Deal submission workflow
- Support request system
- Deal analytics and financial calculations
- Airtable integration for data storage

## Airtable Integration Setup

This application can store data in Airtable for easy access and sharing. Follow these steps to set up the integration:

### 1. Create an Airtable Account

If you don't already have an Airtable account, sign up at [airtable.com](https://airtable.com/).

### 2. Create a New Base

1. In Airtable, create a new base (database)
2. Name it something like "Deal Desk Data"

### 3. Set Up the Required Tables

Create the following tables in your Airtable base:

#### Users Table
- Create a table named "Users" with these fields:
  - id (Number)
  - username (Single line text)
  - password (Single line text)

#### Deals Table
- Create a table named "Deals" with these fields:
  - id (Number)
  - referenceNumber (Single line text)
  - dealName (Single line text)
  - dealType (Single line text)
  - description (Long text)
  - clientName (Single line text)
  - clientType (Single line text)
  - industry (Single line text)
  - region (Single line text)
  - department (Single line text)
  - status (Single line text)
  - totalValue (Number)
  - contractTerm (Number)
  - discountPercentage (Number)
  - costPercentage (Number)
  - expectedCloseDate (Single line text)

#### Support Requests Table
- Create a table named "SupportRequests" with these fields:
  - id (Number)
  - supportType (Single line text)
  - requestTitle (Single line text)
  - description (Long text)
  - status (Single line text)
  - relatedDealId (Number)
  - priorityLevel (Single line text)
  - deadline (Single line text)

### 4. Get Your Airtable API Key

1. Go to your [Airtable account page](https://airtable.com/account)
2. In the API section, generate an API key if you don't already have one
3. Copy your API key

### 5. Get Your Base ID

1. Go to the [Airtable API documentation](https://airtable.com/api)
2. Select your base from the list
3. You'll see your base ID in the documentation (it looks like `appXXXXXXXXXXXXX`)

### 6. Configure Environment Variables

Set the following environment variables with your credentials:

- `AIRTABLE_API_KEY`: Your Airtable API key
- `AIRTABLE_BASE_ID`: Your Airtable base ID

The application will automatically detect these credentials and use Airtable for storage. If the credentials are not provided, it will fall back to in-memory storage.

## Getting Started

1. Install dependencies: `npm install`
2. Start the application: `npm run dev`
3. Open your browser and navigate to the application URL

## Development

- Frontend is built with React and TailwindCSS
- Backend uses Express and Airtable API
- Data storage can use either in-memory storage or Airtable