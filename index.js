const fs = require('fs');
const parser = require('swagger-parser');
const axios = require('axios');
const chai = require('chai');
const { expect } = chai;

const swaggerFilePath = './swagger.json';

// Update the base URL to your backend's URL
const baseUrl = 'https://dev-api.femzi.in';
const apiKey = 'YOUR_API_KEY'; // Replace with your API key

const axiosInstance = axios.create({
  baseURL: baseUrl,
  headers: {
    'X-Access-User': 'YOUR_ACCESS_HEADER', // Replace with your access header value
    'X-Refresh-Token': 'YOUR_ACCESS_TOKEN', // Replace with your access token value
    'Origin': 'http://localhost:4200', // Replace with your actual front-end URL
  },
});

async function runApiTests(apiPath, method) {
  try {
    console.log(`Testing API: ${baseUrl + apiPath} (${method})`);

    // Define the Axios config based on the HTTP method
    const axiosConfig = {
      method, // Use the specified HTTP method
      url: apiPath,
      headers: {
        'X-Access-User': 'YOUR_ACCESS_HEADER', // Replace with your access header value
        'X-Refresh-Token': 'YOUR_ACCESS_TOKEN', // Replace with your access token value
        'Origin': 'http://localhost:4200', // Replace with your actual front-end URL
      },
    };

    // Optionally, add data for POST, PUT, or PATCH requests
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      axiosConfig.data = {}; // Replace with your request data
    }

    // Perform the Axios request
    const response = await axiosInstance(axiosConfig);

    // Check your test conditions
    if (response.status === 200) {
      if (response.data === 'Successfully verified and updated on mailjet') {
        console.log(`API Test for ${apiPath} (${method}) PASSED`);
        return null; // Indicate success by returning null
      } else {
        console.error(`API Test for ${apiPath} (${method}) FAILED: Unexpected response data`);
        return { apiPath, method, error: 'Unexpected response data' };
      }
    } else {
      console.warn(`API Test for ${apiPath} (${method}) SKIPPED: Received status code ${response.status}`);
      return { apiPath, method, error: `Received status code ${response.status}` };
    }
  } catch (error) {
    console.error(`API Test for ${apiPath} (${method}) FAILED: ${error.message}`);
    return { apiPath, method, error: error.message };
  }
}

async function main() {
  try {
    const apiSpec = await parser.parse(swaggerFilePath);
    const paths = apiSpec.paths;

    const errorReports = [];

    for (const apiPath of Object.keys(paths)) {
      const methods = paths[apiPath];
      for (const method of Object.keys(methods)) {
        const errorReport = await runApiTests(apiPath, method.toUpperCase());
        if (errorReport) {
          errorReports.push(errorReport);
        }
      }
    }

    // Create a report document
    const reportFileName = 'api_test_report.txt';
    const reportStream = fs.createWriteStream(reportFileName);

    if (errorReports.length > 0) {
      reportStream.write('API Test Failures:\n\n');
      errorReports.forEach((report) => {
        reportStream.write(`API Path: ${report.apiPath}\n`);
        reportStream.write(`Method: ${report.method}\n`);
        reportStream.write(`Error: ${report.error}\n`);
        reportStream.write('------------------\n');
      });
    } else {
      reportStream.write('All APIs tested successfully.\n');
    }

    reportStream.end();

    console.log(`API test report generated as ${reportFileName}`);
  } catch (error) {
    console.error('Error parsing Swagger document:', error);
  }
}

main();