#!/usr/bin/env node

const axios = require('axios');

// Test the endpoint directly
const testEndpoint = async () => {
  try {
    const token = 'YOUR_JWT_TOKEN_HERE'; // You need to get this from browser localStorage

    // For now, let's inspect the response error more closely
    console.log('Make a request to the failing endpoint and check the response body.');
    console.log('Open browser DevTools → Network → click the failed request → Response tab.');
    console.log('The response should contain the exact error message.\n');

  } catch (error) {
    console.error(error);
  }
};

testEndpoint();
