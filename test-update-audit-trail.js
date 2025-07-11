// Test script for UPDATE audit trail endpoints
import https from 'https';
import fs from 'fs';
import path from 'path';

// Replit domain for testing
const domain = 'https://2e0e2921-8404-40b1-9f29-3f7d2c24fb91-00-18b9nknui5kdl.kirk.replit.dev';

// Test user credentials
const userCredentials = {
  email: 'test@audit.com',
  password: 'testpassword123'
};

// Test entity IDs from the database
const testEntityIds = {
  cycleId: '4bc29c6f-0f50-4f5e-b995-491134972cec',
  objectiveId: 'abb6be85-cb01-4e10-bd84-5375cc7eb0c4',
  keyResultId: '43037f26-eacb-4ad7-ae70-bd109dd8d9df',
  initiativeId: 'ae6d5bcf-95a6-4014-bd2d-85251f4514f0',
  taskId: 'c62a84c0-834f-45ba-8296-6197b929039b',
  successMetricId: '8c1e79fb-36aa-4b9c-be05-c0f6b14b3ed7'
};

// Store session cookie for authentication
let sessionCookie = '';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, domain);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Client',
        ...(sessionCookie && { 'Cookie': sessionCookie })
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        // Store session cookie from login
        if (res.headers['set-cookie']) {
          sessionCookie = res.headers['set-cookie'][0];
        }
        
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Function to authenticate user
async function authenticateUser() {
  console.log('🔐 Authenticating user...');
  
  const response = await makeRequest('POST', '/api/auth/login', userCredentials);
  
  if (response.status === 200) {
    console.log('✅ User authenticated successfully');
    console.log('👤 User:', response.data.user?.email);
    console.log('🏢 Organization:', response.data.user?.organizationId);
    console.log('');
    return response.data.user;
  } else {
    console.error('❌ Authentication failed:', response.data);
    throw new Error('Authentication failed');
  }
}

// Function to test cycle UPDATE endpoint
async function testCycleUpdate() {
  console.log('📅 Testing cycle UPDATE endpoint...');
  
  const updateData = {
    name: 'Updated Cycle Name - Audit Trail Test',
    description: 'Updated description for audit trail testing',
    status: 'active'
  };
  
  const response = await makeRequest('PATCH', `/api/cycles/${testEntityIds.cycleId}`, updateData);
  
  if (response.status === 200) {
    console.log('✅ Cycle update successful');
    console.log('🔍 Updated cycle:', {
      id: response.data.id,
      name: response.data.name,
      updatedAt: response.data.updatedAt,
      lastUpdateBy: response.data.lastUpdateBy
    });
    console.log('');
    return response.data;
  } else {
    console.error('❌ Cycle update failed:', response.data);
    console.log('');
    return null;
  }
}

// Function to test objective UPDATE endpoint
async function testObjectiveUpdate() {
  console.log('🎯 Testing objective UPDATE endpoint...');
  
  const updateData = {
    title: 'Updated Objective - Audit Trail Test',
    description: 'Updated description for audit trail testing',
    status: 'in_progress'
  };
  
  const response = await makeRequest('PATCH', `/api/objectives/${testEntityIds.objectiveId}`, updateData);
  
  if (response.status === 200) {
    console.log('✅ Objective update successful');
    console.log('🔍 Updated objective:', {
      id: response.data.id,
      title: response.data.title,
      updatedAt: response.data.updatedAt,
      lastUpdateBy: response.data.lastUpdateBy
    });
    console.log('');
    return response.data;
  } else {
    console.error('❌ Objective update failed:', response.data);
    console.log('');
    return null;
  }
}

// Function to test key result UPDATE endpoint
async function testKeyResultUpdate() {
  console.log('🔑 Testing key result UPDATE endpoint...');
  
  const updateData = {
    title: 'Updated Key Result - Audit Trail Test',
    description: 'Updated description for audit trail testing',
    currentValue: '75',
    targetValue: '100'
  };
  
  const response = await makeRequest('PATCH', `/api/key-results/${testEntityIds.keyResultId}`, updateData);
  
  if (response.status === 200) {
    console.log('✅ Key result update successful');
    console.log('🔍 Updated key result:', {
      id: response.data.id,
      title: response.data.title,
      updatedAt: response.data.updatedAt,
      lastUpdateBy: response.data.lastUpdateBy
    });
    console.log('');
    return response.data;
  } else {
    console.error('❌ Key result update failed:', response.data);
    console.log('');
    return null;
  }
}

// Function to test initiative UPDATE endpoint
async function testInitiativeUpdate() {
  console.log('🚀 Testing initiative UPDATE endpoint...');
  
  const updateData = {
    title: 'Updated Initiative - Audit Trail Test',
    description: 'Updated description for audit trail testing',
    status: 'in_progress',
    priority: 'high'
  };
  
  const response = await makeRequest('PATCH', `/api/initiatives/${testEntityIds.initiativeId}`, updateData);
  
  if (response.status === 200) {
    console.log('✅ Initiative update successful');
    console.log('🔍 Updated initiative:', {
      id: response.data.id,
      title: response.data.title,
      updatedAt: response.data.updatedAt,
      lastUpdateBy: response.data.lastUpdateBy
    });
    console.log('');
    return response.data;
  } else {
    console.error('❌ Initiative update failed:', response.data);
    console.log('');
    return null;
  }
}

// Function to test task UPDATE endpoint
async function testTaskUpdate() {
  console.log('📋 Testing task UPDATE endpoint...');
  
  const updateData = {
    title: 'Updated Task - Audit Trail Test',
    description: 'Updated description for audit trail testing',
    status: 'in_progress',
    priority: 'medium'
  };
  
  const response = await makeRequest('PATCH', `/api/tasks/${testEntityIds.taskId}`, updateData);
  
  if (response.status === 200) {
    console.log('✅ Task update successful');
    console.log('🔍 Updated task:', {
      id: response.data.id,
      title: response.data.title,
      updatedAt: response.data.updatedAt,
      lastUpdateBy: response.data.lastUpdateBy
    });
    console.log('');
    return response.data;
  } else {
    console.error('❌ Task update failed:', response.data);
    console.log('');
    return null;
  }
}

// Function to test success metric UPDATE endpoint
async function testSuccessMetricUpdate() {
  console.log('📊 Testing success metric UPDATE endpoint...');
  
  const updateData = {
    title: 'Updated Success Metric - Audit Trail Test',
    description: 'Updated description for audit trail testing',
    target: '90',
    achievement: '65'
  };
  
  const response = await makeRequest('PATCH', `/api/success-metrics/${testEntityIds.successMetricId}`, updateData);
  
  if (response.status === 200) {
    console.log('✅ Success metric update successful');
    console.log('🔍 Updated success metric:', {
      id: response.data.id,
      title: response.data.title,
      updatedAt: response.data.updatedAt,
      lastUpdateBy: response.data.lastUpdateBy
    });
    console.log('');
    return response.data;
  } else {
    console.error('❌ Success metric update failed:', response.data);
    console.log('');
    return null;
  }
}

// Function to generate test report
function generateTestReport(results) {
  console.log('📋 UPDATE AUDIT TRAIL TEST REPORT');
  console.log('=================================');
  console.log('');
  
  const endpoints = [
    { name: 'Cycle UPDATE', result: results.cycle },
    { name: 'Objective UPDATE', result: results.objective },
    { name: 'Key Result UPDATE', result: results.keyResult },
    { name: 'Initiative UPDATE', result: results.initiative },
    { name: 'Task UPDATE', result: results.task },
    { name: 'Success Metric UPDATE', result: results.successMetric }
  ];
  
  let passedCount = 0;
  let failedCount = 0;
  
  endpoints.forEach(endpoint => {
    const status = endpoint.result ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} ${endpoint.name}`);
    if (endpoint.result) {
      passedCount++;
      console.log(`  ┌─ Updated At: ${endpoint.result.updatedAt || 'N/A'}`);
      console.log(`  └─ Last Updated By: ${endpoint.result.lastUpdateBy || 'N/A'}`);
    } else {
      failedCount++;
    }
    console.log('');
  });
  
  console.log(`📊 SUMMARY: ${passedCount} passed, ${failedCount} failed`);
  console.log('');
  
  if (failedCount === 0) {
    console.log('🎉 ALL UPDATE AUDIT TRAIL TESTS PASSED!');
    console.log('✅ UPDATE tracking fully implemented for all major entities');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }
}

// Main test function
async function runUpdateAuditTrailTests() {
  try {
    console.log('🧪 STARTING UPDATE AUDIT TRAIL TESTING');
    console.log('======================================');
    console.log('');
    
    // Authenticate user
    const user = await authenticateUser();
    
    // Test results storage
    const results = {};
    
    // Test all UPDATE endpoints
    results.cycle = await testCycleUpdate();
    results.objective = await testObjectiveUpdate();
    results.keyResult = await testKeyResultUpdate();
    results.initiative = await testInitiativeUpdate();
    results.task = await testTaskUpdate();
    results.successMetric = await testSuccessMetricUpdate();
    
    // Generate test report
    generateTestReport(results);
    
    // Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `update-audit-trail-test-${timestamp}.json`;
    
    fs.writeFileSync(filename, JSON.stringify({
      timestamp: new Date().toISOString(),
      user: user?.email,
      organization: user?.organizationId,
      results
    }, null, 2));
    
    console.log(`📄 Test results saved to: ${filename}`);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Execute tests
runUpdateAuditTrailTests();