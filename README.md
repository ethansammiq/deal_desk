# Deal Desk Application

A comprehensive deal desk application for submitting commercial deals for approval, requesting support, and tracking deal status.

## Features

- Dashboard with deal statistics and overview
- Deal submission workflow
- Support request system
- Deal analytics and financial calculations
- Google Sheets integration for data storage

## Google Sheets Integration Setup

This application can store data in Google Sheets for easy access and sharing. Follow these steps to set up the integration:

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" at the top right, then click "New Project"
3. Name your project (for example, "Deal Desk Integration") and click "Create"
4. Select your new project from the project selector at the top

### 2. Enable the Google Sheets API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on "Google Sheets API" in the search results
4. Click "Enable"

### 3. Create a Service Account

1. In the Google Cloud Console, go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" and select "Service account"
3. Enter a name for your service account (e.g., "Deal Desk Service Account")
4. Click "Create and Continue"
5. For the role, select "Project" → "Editor" (or a more restrictive role if preferred)
6. Click "Continue" and then "Done"

### 4. Generate Service Account Keys

1. On the Credentials page, find your new service account in the list and click on its name
2. Go to the "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON" as the key type and click "Create"
5. A JSON file will be downloaded to your computer - this contains your credentials

### 5. Create and Share a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/) and create a new spreadsheet
2. Name your spreadsheet (e.g., "Deal Desk Data")
3. Click the "Share" button in the top right
4. Enter the service account email (it will look like `service-account-name@project-id.iam.gserviceaccount.com`)
5. Make sure the permission is set to "Editor"
6. Click "Send" (no email will actually be sent)

### 6. Configure Environment Variables

Set the following environment variables with your credentials:

- `GOOGLE_CLIENT_EMAIL`: The email address of your service account (from the JSON file)
- `GOOGLE_PRIVATE_KEY`: The private key from the JSON file (including the BEGIN and END parts)
- `GOOGLE_SPREADSHEET_ID`: The ID of your Google Sheet (found in the URL)

The application will automatically detect these credentials and use Google Sheets for storage. If the credentials are not provided, it will fall back to in-memory storage.

## Getting Started

1. Install dependencies: `npm install`
2. Start the application: `npm run dev`
3. Open your browser and navigate to the application URL

## Development

- Frontend is built with React and TailwindCSS
- Backend uses Express and Google Sheets API
- Data storage can use either in-memory storage or Google Sheets