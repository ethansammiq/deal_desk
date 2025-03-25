// Simple test script to check Anthropic API connectivity
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

console.log("Testing Anthropic API connection...");

async function testApi() {
  try {
    console.log("Sending request to Claude...");
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 100,
      messages: [{ role: "user", content: "Hello, can you hear me?" }],
      system: "You are a helpful assistant that gives very short answers."
    });

    console.log("Response received successfully!");
    console.log("Response content:", response.content[0].text);
    return true;
  } catch (error) {
    console.error("Error testing Anthropic API:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      type: error.type
    });
    return false;
  }
}

testApi().then(success => {
  if (success) {
    console.log("API test SUCCESSFUL! Claude is working properly.");
  } else {
    console.log("API test FAILED! There's an issue with the Claude connection.");
  }
}).catch(err => {
  console.error("Unexpected error during test:", err);
});