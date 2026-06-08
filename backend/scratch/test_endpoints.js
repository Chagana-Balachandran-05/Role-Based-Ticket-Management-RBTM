const http = require('http');

const request = (method, path, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- STARTING BACKEND INTEGRATION TESTS ---');

  // Helper assertion
  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`[PASS] ${message}`);
  };


  // 1. Health check
  const healthRes = await request('GET', '/api/health');
  assert(healthRes.statusCode === 200, 'Health check status is 200');
  assert(healthRes.data.status === 'ok', 'Health check body status is ok');

  // 2. Authentication Login
  const loginRes = await request('POST', '/api/auth/login', {}, {
    email: 'admin@rbtm.com',
    password: 'Admin@123',
  });
  assert(loginRes.statusCode === 200, 'Login returns 200');
  assert(loginRes.data.success === true, 'Login response format has success: true');
  assert(loginRes.data.data.token, 'Login returns token');
  assert(loginRes.data.data.user._id, 'Login returns user object with _id');
  assert(loginRes.data.data.user.role === 'Admin', 'Login returns user with Admin role');

  const adminToken = loginRes.data.data.token;
  const adminId = loginRes.data.data.user._id;

  // Login Agent
  const agentLogin = await request('POST', '/api/auth/login', {}, {
    email: 'agent@rbtm.com',
    password: 'Agent@123',
  });
  assert(agentLogin.statusCode === 200, 'Agent Login returns 200');
  const agentToken = agentLogin.data.data.token;
  const agentId = agentLogin.data.data.user._id;

  // Login User
  const userLogin = await request('POST', '/api/auth/login', {}, {
    email: 'user@rbtm.com',
    password: 'User@123',
  });
  assert(userLogin.statusCode === 200, 'User Login returns 200');
  const userToken = userLogin.data.data.token;
  const userId = userLogin.data.data.user._id;

  // 3. Register user
  const regRes = await request('POST', '/api/auth/register', {}, {
    name: 'New Test User',
    email: 'test' + Date.now() + '@rbtm.com',
    password: 'Password@123',
  });
  assert(regRes.statusCode === 201, 'Register returns 201');
  assert(regRes.data.data.user._id, 'Register user has _id');
  assert(regRes.data.data.token, 'Register returns token');

  // 4. /me endpoint
  const meRes = await request('GET', '/api/auth/me', { Authorization: `Bearer ${userToken}` });
  assert(meRes.statusCode === 200, '/me returns 200');
  assert(meRes.data.data._id === userId, '/me returns correct user data');
  assert(meRes.data.data.password === undefined, '/me does not return password');

  // 5. Get tickets (paginated)
  const ticketsRes = await request('GET', '/api/tickets', { Authorization: `Bearer ${userToken}` });
  assert(ticketsRes.statusCode === 200, 'Get tickets returns 200');
  assert(Array.isArray(ticketsRes.data.data.tickets), 'Get tickets has tickets array');
  assert(typeof ticketsRes.data.data.total === 'number', 'Get tickets has total count');

  // 6. Create ticket
  const createTktRes = await request('POST', '/api/tickets', { Authorization: `Bearer ${userToken}` }, {
    title: 'Test ticket title',
    description: 'Test ticket description',
    category: 'Bug',
    priority: 'High',
  });
  assert(createTktRes.statusCode === 201, 'Create ticket returns 201');
  assert(createTktRes.data.data.ticketNumber.startsWith('TKT-'), 'Ticket number generated starting with TKT-');
  const createdTicket = createTktRes.data.data;

  // 7. GET single ticket (Access control check: agent cannot access it because not assigned)
  const accessDeniedRes = await request('GET', `/api/tickets/${createdTicket._id}`, { Authorization: `Bearer ${agentToken}` });
  assert(accessDeniedRes.statusCode === 403, 'Agent denied access to unassigned ticket (returns 403)');

  // 8. Assign ticket to agent (Admin only)
  const assignRes = await request('PATCH', `/api/tickets/${createdTicket._id}/assign`, { Authorization: `Bearer ${adminToken}` }, {
    assignedTo: agentId,
  });
  assert(assignRes.statusCode === 200, 'Assigning ticket to agent returns 200');
  assert(assignRes.data.data.assignedTo._id === agentId, 'Ticket assignedTo is populated with agent ID');

  // 9. Now agent gets ticket
  const agentGetRes = await request('GET', `/api/tickets/${createdTicket._id}`, { Authorization: `Bearer ${agentToken}` });
  assert(agentGetRes.statusCode === 200, 'Agent can now access assigned ticket (returns 200)');

  // 10. Update ticket status (Agent only)
  const statusRes = await request('PATCH', `/api/tickets/${createdTicket._id}/status`, { Authorization: `Bearer ${agentToken}` }, {
    status: 'In Progress',
    note: 'Started working on it',
  });
  assert(statusRes.statusCode === 200, 'Updating status returns 200');
  assert(statusRes.data.data.status === 'In Progress', 'Status updated successfully');
  assert(statusRes.data.data.statusHistory.length > 1, 'Status history has entries');

  // 11. Add comment
  const commentRes = await request('POST', `/api/tickets/${createdTicket._id}/comments`, { Authorization: `Bearer ${userToken}` }, {
    text: 'A user comment',
  });
  assert(commentRes.statusCode === 201, 'Adding comment returns 201');
  assert(commentRes.data.data.comments.length > 0, 'Comment is visible in comments array');

  // 12. Dashboard stats
  const dashRes = await request('GET', '/api/dashboard/stats', { Authorization: `Bearer ${agentToken}` });
  assert(dashRes.statusCode === 200, 'Dashboard stats returns 200');
  assert(dashRes.data.data.total !== undefined, 'Stats has total');
  assert(dashRes.data.data.inProgress !== undefined, 'Stats has inProgress');
  assert(Array.isArray(dashRes.data.data.byPriority), 'Stats has byPriority array');

  // 13. GET all users (Admin only)
  const usersRes = await request('GET', '/api/users', { Authorization: `Bearer ${adminToken}` });
  assert(usersRes.statusCode === 200, 'Get users returns 200');
  assert(Array.isArray(usersRes.data.data), 'Get users returns an array of users');

  // 14. GET users with role Agent
  const agentsRes = await request('GET', '/api/users?role=Agent', { Authorization: `Bearer ${adminToken}` });
  assert(agentsRes.statusCode === 200, 'Get agents returns 200');
  assert(agentsRes.data.data.every(u => u.role === 'Agent'), 'All users returned have Agent role');

  // 15. PUT update user role/name
  const updateUsrRes = await request('PUT', `/api/users/${userId}`, { Authorization: `Bearer ${adminToken}` }, {
    name: 'Updated Name',
    email: 'user@rbtm.com',
    role: 'User',
  });
  assert(updateUsrRes.statusCode === 200, 'Updating user returns 200');
  assert(updateUsrRes.data.data.name === 'Updated Name', 'User name is updated');

  // 16. DELETE user (cannot delete self)
  const deleteSelfRes = await request('DELETE', `/api/users/${adminId}`, { Authorization: `Bearer ${adminToken}` });
  assert(deleteSelfRes.statusCode === 400, 'Deleting self returns 400');
  assert(deleteSelfRes.data.message === 'Cannot delete self', 'Deleting self error message matches');

  // 17. Error cases
  // Wrong login
  const badLogin = await request('POST', '/api/auth/login', {}, { email: 'admin@rbtm.com', password: 'wrongpassword' });
  assert(badLogin.statusCode === 401, 'Wrong password login returns 401');

  // GET tickets without token
  const noToken = await request('GET', '/api/tickets');
  assert(noToken.statusCode === 401, 'GET tickets without token returns 401');

  // Invalid ObjectId format
  const badId = await request('GET', '/api/tickets/invalidId', { Authorization: `Bearer ${adminToken}` });
  assert(badId.statusCode === 400, 'Invalid ObjectId format returns 400');
  assert(badId.data.message === 'Invalid ID format', 'Error message is "Invalid ID format"');

  // Non-existent ticket
  const missingTkt = await request('GET', '/api/tickets/60a9f1b9f9b9a123456789ab', { Authorization: `Bearer ${adminToken}` });
  assert(missingTkt.statusCode === 404, 'Non-existent ticket returns 404');
  assert(missingTkt.data.message === 'Ticket not found', 'Error message is "Ticket not found"');

  // Delete as Agent
  const deleteForbidden = await request('DELETE', `/api/users/${userId}`, { Authorization: `Bearer ${agentToken}` });
  assert(deleteForbidden.statusCode === 403, 'Delete user as Agent returns 403');

  // Missing required field
  const badCreate = await request('POST', '/api/tickets', { Authorization: `Bearer ${userToken}` }, { title: 'Missing category and description' });
  assert(badCreate.statusCode === 422, 'Ticket creation with missing fields returns 422');
  assert(badCreate.data.success === false, 'Failed validation response has success: false');

  console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
};

runTests().catch((err) => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
