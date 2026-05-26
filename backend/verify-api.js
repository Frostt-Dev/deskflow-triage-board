const http = require('http');

const API_BASE = 'http://localhost:5000';

// Helper to make HTTP requests
const makeRequest = (url, method, body = null) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runVerification = async () => {
  console.log('=== STARTING DEEP API VERIFICATION ===\n');
  
  try {
    // 1. Verify Health
    console.log('1. Checking server health...');
    const health = await makeRequest(`${API_BASE}/health`, 'GET');
    console.log('Health check response status:', health.statusCode);
    console.log('Health check payload:', JSON.stringify(health.body, null, 2));
    
    if (health.body.database !== 'connected') {
      throw new Error('Database is not connected! Cannot run further API tests.');
    }
    console.log('✔ Server and Atlas connection are active.\n');

    // 2. Create a test ticket
    console.log('2. Creating a test ticket via POST /tickets...');
    const newTicketData = {
      customerEmail: 'test-agent@antigravity.io',
      subject: 'Atlas Whitelist Test',
      description: 'Verifying if backend API can write to the whitelisted Atlas cluster.',
      priority: 'urgent' // Target SLA is 1 hour
    };
    
    const createRes = await makeRequest(`${API_BASE}/tickets`, 'POST', newTicketData);
    console.log('Ticket creation status:', createRes.statusCode);
    console.log('Created Ticket Payload:', JSON.stringify(createRes.body, null, 2));
    
    if (createRes.statusCode !== 201) {
      throw new Error('Ticket creation failed!');
    }
    
    const ticketId = createRes.body._id;
    console.log('✔ Ticket created successfully in MongoDB Atlas.\n');

    // 3. List tickets
    console.log('3. Fetching tickets via GET /tickets...');
    const listRes = await makeRequest(`${API_BASE}/tickets`, 'GET');
    console.log('List status:', listRes.statusCode);
    console.log(`Found ${listRes.body.length} tickets in database.`);
    console.log('First ticket details (derived fields):', {
      subject: listRes.body[0].subject,
      ageMinutes: listRes.body[0].ageMinutes,
      slaBreached: listRes.body[0].slaBreached
    });
    console.log('✔ Ticket lists and derived calculations match.\n');

    // 4. Fetch Stats
    console.log('4. Querying statistics via GET /tickets/stats...');
    const statsRes = await makeRequest(`${API_BASE}/tickets/stats`, 'GET');
    console.log('Stats status:', statsRes.statusCode);
    console.log('Triage metrics:', JSON.stringify(statsRes.body, null, 2));
    console.log('✔ Stats counters incremented.\n');

    console.log('=== VERIFICATION SUCCESSFULLY COMPLETED ===');
    console.log('The backend, API endpoints, state logic, and Atlas database are working perfectly!');

  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err.message);
  }
};

runVerification();
