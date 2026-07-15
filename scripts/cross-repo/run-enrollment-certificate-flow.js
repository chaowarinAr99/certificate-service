const path = require('node:path');
const { spawn } = require('node:child_process');
const net = require('node:net');
const fs = require('node:fs/promises');

const CERTIFICATE_REPO_ROOT = path.resolve(__dirname, '../..');
const DEFAULT_ENROLLMENT_REPO_ROOT = path.resolve(
  CERTIFICATE_REPO_ROOT,
  '../enrollment-service/enrollment-service',
);
const ENROLLMENT_REPO_ROOT =
  process.env.ENROLLMENT_SERVICE_DIR ||
  DEFAULT_ENROLLMENT_REPO_ROOT;
const runtimeMode = process.env.CROSS_REPO_RUNTIME_MODE || 'managed';
const crossRepoComposeFile =
  process.env.CROSS_REPO_COMPOSE_FILE ||
  path.join(CERTIFICATE_REPO_ROOT, 'docker-compose.cross-repo.yml');

const PORTS = {
  enrollment: 3000,
  certificate: 4000,
  fakeProvider: 5500,
  mountebankAdmin: 2525,
};

const SCENARIOS = {
  'happy-phy001': {
    mode: 'cross-repo',
    employeeId: 'EMP001',
    courseId: 'PHY001',
    approvedBy: 'HR001',
    imposter: 'mountebank/imposters/success.json',
  },
  'happy-che001': {
    mode: 'cross-repo',
    employeeId: 'EMP002',
    courseId: 'CHE001',
    approvedBy: 'HR001',
    imposter: 'mountebank/imposters/success.json',
  },
  'happy-com001': {
    mode: 'cross-repo',
    employeeId: 'EMP003',
    courseId: 'COM001',
    approvedBy: 'HR001',
    imposter: 'mountebank/imposters/success.json',
  },
  'missing-ref-id': {
    mode: 'service-only',
    requestBody: { learnerId: 'EMP001', courseRef: 'PHY001' },
    expectedStatus: 400,
    expectedMessageContains: 'refId should not be empty',
    imposter: 'mountebank/imposters/success.json',
  },
  'missing-learner-id': {
    mode: 'service-only',
    requestBody: { refId: 'ENR001', courseRef: 'PHY001' },
    expectedStatus: 400,
    expectedMessageContains: 'learnerId should not be empty',
    imposter: 'mountebank/imposters/success.json',
  },
  'missing-course-ref': {
    mode: 'service-only',
    requestBody: { refId: 'ENR001', learnerId: 'EMP001' },
    expectedStatus: 400,
    expectedMessageContains: 'courseRef should not be empty',
    imposter: 'mountebank/imposters/success.json',
  },
  'empty-ref-id': {
    mode: 'service-only',
    requestBody: { refId: '', learnerId: 'EMP001', courseRef: 'PHY001' },
    expectedStatus: 400,
    expectedMessageContains: 'refId should not be empty',
    imposter: 'mountebank/imposters/success.json',
  },
  'empty-learner-id': {
    mode: 'service-only',
    requestBody: { refId: 'ENR001', learnerId: '', courseRef: 'PHY001' },
    expectedStatus: 400,
    expectedMessageContains: 'learnerId should not be empty',
    imposter: 'mountebank/imposters/success.json',
  },
  'empty-course-ref': {
    mode: 'service-only',
    requestBody: { refId: 'ENR001', learnerId: 'EMP001', courseRef: '' },
    expectedStatus: 400,
    expectedMessageContains: 'courseRef should not be empty',
    imposter: 'mountebank/imposters/success.json',
  },
  'whitespace-ref-id': {
    mode: 'service-only',
    requestBody: { refId: '   ', learnerId: 'EMP001', courseRef: 'PHY001' },
    expectedStatus: 400,
    expectedMessageEquals: 'enrollmentId is required',
    imposter: 'mountebank/imposters/success.json',
  },
  'whitespace-learner-id': {
    mode: 'service-only',
    requestBody: { refId: 'ENR001', learnerId: '   ', courseRef: 'PHY001' },
    expectedStatus: 400,
    expectedMessageEquals: 'employeeId is required',
    imposter: 'mountebank/imposters/success.json',
  },
  'whitespace-course-ref': {
    mode: 'service-only',
    requestBody: { refId: 'ENR001', learnerId: 'EMP001', courseRef: '   ' },
    expectedStatus: 400,
    expectedMessageEquals: 'courseId is required',
    imposter: 'mountebank/imposters/success.json',
  },
  'upstream-api-error': {
    mode: 'cross-repo',
    employeeId: 'EMP002',
    courseId: 'PHY001',
    approvedBy: 'HR001',
    imposter: 'mountebank/imposters/non-2xx.json',
    expectedStatus: 502,
    expectedBody: { message: 'Cannot generate certificate', code: 'CERTIFICATE_API_ERROR' },
  },
  'invalid-upstream-missing-certificate-id': {
    mode: 'cross-repo',
    employeeId: 'EMP002',
    courseId: 'PHY001',
    approvedBy: 'HR001',
    imposter: 'mountebank/imposters/missing-certificate-id.json',
    expectedStatus: 502,
    expectedBody: { message: 'Cannot generate certificate', code: 'CERTIFICATE_API_ERROR' },
  },
  'invalid-upstream-missing-certificate-url': {
    mode: 'cross-repo',
    employeeId: 'EMP002',
    courseId: 'PHY001',
    approvedBy: 'HR001',
    imposter: 'mountebank/imposters/missing-certificate-url.json',
    expectedStatus: 502,
    expectedBody: { message: 'Cannot generate certificate', code: 'CERTIFICATE_API_ERROR' },
  },
  'invalid-upstream-missing-issued-at': {
    mode: 'cross-repo',
    employeeId: 'EMP002',
    courseId: 'PHY001',
    approvedBy: 'HR001',
    imposter: 'mountebank/imposters/missing-issued-at.json',
    expectedStatus: 502,
    expectedBody: { message: 'Cannot generate certificate', code: 'CERTIFICATE_API_ERROR' },
  },
  'invalid-upstream-status': {
    mode: 'cross-repo',
    employeeId: 'EMP002',
    courseId: 'PHY001',
    approvedBy: 'HR001',
    imposter: 'mountebank/imposters/invalid-status.json',
    expectedStatus: 502,
    expectedBody: { message: 'Cannot generate certificate', code: 'CERTIFICATE_API_ERROR' },
  },
  timeout: {
    mode: 'cross-repo',
    employeeId: 'EMP002',
    courseId: 'PHY001',
    approvedBy: 'HR001',
    imposter: 'mountebank/imposters/timeout.json',
    expectedStatus: 502,
    expectedBody: { message: 'Cannot generate certificate', code: 'CERTIFICATE_API_ERROR' },
  },
};

const HEALTH_URLS = {
  enrollment: `http://127.0.0.1:${PORTS.enrollment}/health`,
  certificate: `http://127.0.0.1:${PORTS.certificate}/health`,
  mountebank: `http://127.0.0.1:${PORTS.mountebankAdmin}/imposters`,
};

function logStep(message) {
  console.log(`\n[step] ${message}`);
}

function spawnProcess(command, args, options = {}) {
  return spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
}

async function stopProcess(child, signal = 'SIGTERM') {
  if (!child || child.killed) {
    return;
  }

  await new Promise((resolve) => {
    child.once('exit', () => resolve());
    child.kill(signal);
  });
}

async function runCommand(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function waitForHttp(url, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
    } catch {
      // retry until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function assertPortFree(port) {
  await new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });

    socket.once('connect', () => {
      socket.destroy();
      reject(new Error(`Port ${port} is already in use. Stop the existing process before running the managed cross-repo flow.`));
    });

    socket.once('error', (error) => {
      socket.destroy();
      if (error.code === 'ECONNREFUSED') {
        resolve();
        return;
      }

      reject(error);
    });
  });
}

async function assertPathExists() {
  await fs.access(ENROLLMENT_REPO_ROOT).catch(() => {
    throw new Error(
      `Enrollment service repo not found at ${ENROLLMENT_REPO_ROOT}. ` +
        'Set ENROLLMENT_SERVICE_DIR=/path/to/enrollment-service/enrollment-service',
    );
  });
}

async function sendJson(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseText = await response.text();
  let json;
  try {
    json = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    json = responseText;
  }

  return {
    status: response.status,
    body: json,
  };
}

async function resetEnrollmentMongoDatabase() {
  const script = 'db.dropDatabase()';

  if (runtimeMode === 'external') {
    await runCommand(
      'docker',
      ['compose', '-f', crossRepoComposeFile, 'exec', '-T', 'mongo', 'mongosh', 'enrollment_service', '--quiet', '--eval', script],
      {
        cwd: CERTIFICATE_REPO_ROOT,
        stdio: 'inherit',
      },
    );
    return;
  }

  await runCommand(
    'docker',
    ['exec', 'enrollment-mongo', 'mongosh', 'enrollment_service', '--quiet', '--eval', script],
    {
      cwd: ENROLLMENT_REPO_ROOT,
      stdio: 'inherit',
    },
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertExpectedBody(actualBody, expectedBody, context) {
  assert(actualBody && typeof actualBody === 'object', `${context} body is missing or invalid: ${JSON.stringify(actualBody)}`);
  for (const [key, value] of Object.entries(expectedBody)) {
    assert(actualBody[key] === value, `${context} body mismatch for ${key}: expected ${value}, got ${actualBody[key]}`);
  }
}

function assertMessage(responseBody, scenario) {
  if (scenario.expectedMessageEquals) {
    assert(responseBody.message === scenario.expectedMessageEquals, `Expected message '${scenario.expectedMessageEquals}' but got ${JSON.stringify(responseBody.message)}`);
    return;
  }

  if (scenario.expectedMessageContains) {
    if (Array.isArray(responseBody.message)) {
      assert(
        responseBody.message.some((message) => String(message).includes(scenario.expectedMessageContains)),
        `Expected one message to contain '${scenario.expectedMessageContains}' but got ${JSON.stringify(responseBody.message)}`,
      );
      return;
    }

    assert(
      String(responseBody.message).includes(scenario.expectedMessageContains),
      `Expected message to contain '${scenario.expectedMessageContains}' but got ${JSON.stringify(responseBody.message)}`,
    );
  }
}

async function startManagedRuntime() {
  logStep('Checking repo paths and required ports');
  await assertPathExists();
  await assertPortFree(PORTS.mountebankAdmin);
  await assertPortFree(PORTS.certificate);
  await assertPortFree(PORTS.fakeProvider);
  await assertPortFree(PORTS.enrollment);

  logStep('Starting Mountebank');
  const mountebankProcess = spawnProcess(
    'npx',
    ['mb', 'start', '--port', String(PORTS.mountebankAdmin), '--pidfile', '.mb.pid', '--loglevel', 'warn'],
    { cwd: CERTIFICATE_REPO_ROOT },
  );
  await waitForHttp(HEALTH_URLS.mountebank, 15000);

  logStep('Starting certificate-service');
  const certificateProcess = spawnProcess('npm', ['run', 'start:api-test'], {
    cwd: CERTIFICATE_REPO_ROOT,
    env: {
      ...process.env,
      PORT: String(PORTS.certificate),
      EXTERNAL_CERTIFICATE_API_URL: `http://localhost:${PORTS.fakeProvider}/provider/certificates`,
      EXTERNAL_CERTIFICATE_API_TIMEOUT_MS: '1000',
    },
  });
  await waitForHttp(HEALTH_URLS.certificate, 20000);

  return { mountebankProcess, certificateProcess };
}

async function startManagedEnrollmentRuntime() {
  logStep('Starting enrollment-service Mongo setup');
  await runCommand('npm', ['run', 'mongo:start'], {
    cwd: ENROLLMENT_REPO_ROOT,
    stdio: 'inherit',
  });

  logStep('Resetting enrollment_service database before app startup');
  await resetEnrollmentMongoDatabase();

  logStep('Starting enrollment-service');
  const enrollmentProcess = spawnProcess('npm', ['run', 'start'], {
    cwd: ENROLLMENT_REPO_ROOT,
    env: {
      ...process.env,
      PORT: String(PORTS.enrollment),
      MONGO_URL: 'mongodb://127.0.0.1:27017',
      MONGO_DB_NAME: 'enrollment_service',
      MONGO_SEED_ON_START: 'true',
      CERTIFICATE_API_URL: `http://localhost:${PORTS.certificate}/certificates`,
    },
  });
  await waitForHttp(HEALTH_URLS.enrollment, 20000);

  return enrollmentProcess;
}

async function prepareExternalRuntime(scenario) {
  logStep(`Loading imposter for scenario '${scenario.key}'`);
  await runCommand('node', ['scripts/mountebank/load-imposter.js', scenario.imposter], {
    cwd: CERTIFICATE_REPO_ROOT,
    stdio: 'inherit',
  });

  await waitForHttp(HEALTH_URLS.certificate, 20000);

  if (scenario.mode === 'cross-repo') {
    logStep('Resetting enrollment_service database before scenario');
    await resetEnrollmentMongoDatabase();
    logStep('Restarting enrollment-service to reseed database');
    await runCommand('docker', ['compose', '-f', crossRepoComposeFile, 'restart', 'enrollment-service'], {
      cwd: CERTIFICATE_REPO_ROOT,
      stdio: 'inherit',
    });
    await waitForHttp(HEALTH_URLS.enrollment, 20000);
  }
}

async function runServiceOnlyScenario(scenario) {
  logStep('Calling certificate-service directly');
  const lastResponse = await sendJson(`http://127.0.0.1:${PORTS.certificate}/certificates`, 'POST', scenario.requestBody);
  assert(lastResponse.status === scenario.expectedStatus, `Service-only scenario failed: ${JSON.stringify(lastResponse)}`);
  assertMessage(lastResponse.body, scenario);
  return lastResponse;
}

async function runCrossRepoScenario(scenario) {
  let lastResponse;

  logStep('Creating enrollment');
  lastResponse = await sendJson(`http://127.0.0.1:${PORTS.enrollment}/enrollments`, 'POST', {
    employeeId: scenario.employeeId,
    courseId: scenario.courseId,
  });
  assert(lastResponse.status >= 200 && lastResponse.status < 300, `Create enrollment failed: ${JSON.stringify(lastResponse)}`);
  assert(lastResponse.body && lastResponse.body.enrollmentId, `Create enrollment did not return enrollmentId: ${JSON.stringify(lastResponse)}`);
  assert(lastResponse.body && lastResponse.body.status === 'PENDING_APPROVAL', `Create enrollment did not return PENDING_APPROVAL: ${JSON.stringify(lastResponse)}`);

  const enrollmentId = lastResponse.body.enrollmentId;

  logStep('Approving enrollment');
  lastResponse = await sendJson(`http://127.0.0.1:${PORTS.enrollment}/enrollments/${enrollmentId}/approve`, 'PATCH', {
    approvedBy: scenario.approvedBy,
  });
  assert(lastResponse.status >= 200 && lastResponse.status < 300, `Approve enrollment failed: ${JSON.stringify(lastResponse)}`);
  assert(lastResponse.body && lastResponse.body.status === 'APPROVED', `Approve response missing APPROVED status: ${JSON.stringify(lastResponse)}`);
  assert(lastResponse.body && lastResponse.body.approvedBy === scenario.approvedBy, `Approve response missing approvedBy: ${JSON.stringify(lastResponse)}`);

  logStep('Generating certificate');
  lastResponse = await sendJson(`http://127.0.0.1:${PORTS.enrollment}/enrollments/${enrollmentId}/certificate`, 'POST', {
    progress: 100,
  });

  if (scenario.expectedStatus) {
    assert(lastResponse.status === scenario.expectedStatus, `Generate certificate returned unexpected status: ${JSON.stringify(lastResponse)}`);
    assertExpectedBody(lastResponse.body, scenario.expectedBody, 'Generate certificate');
    return lastResponse;
  }

  assert(lastResponse.status >= 200 && lastResponse.status < 300, `Generate certificate failed: ${JSON.stringify(lastResponse)}`);
  assert(lastResponse.body, `Generate certificate returned empty body: ${JSON.stringify(lastResponse)}`);
  assertExpectedBody(lastResponse.body, { enrollmentId, certificateStatus: 'CERTIFICATE_ISSUED' }, 'Generate certificate');
  assert(
    lastResponse.body.certificate &&
      lastResponse.body.certificate.certificateId &&
      lastResponse.body.certificate.certificateUrl &&
      lastResponse.body.certificate.issuedAt,
    `Generate certificate response missing certificate object: ${JSON.stringify(lastResponse)}`,
  );

  logStep('Fetching enrollment after certificate generation');
  const enrollmentResponse = await sendJson(
    `http://127.0.0.1:${PORTS.enrollment}/enrollments/${enrollmentId}`,
    'GET',
  );
  assert(
    enrollmentResponse.status >= 200 && enrollmentResponse.status < 300,
    `Get enrollment after certificate generation failed: ${JSON.stringify(enrollmentResponse)}`,
  );
  assertExpectedBody(
    enrollmentResponse.body,
    {
      id: enrollmentId,
      status: 'APPROVED',
      certificateStatus: 'CERTIFICATE_ISSUED',
      certificateUrl: lastResponse.body.certificate.certificateUrl,
    },
    'Enrollment persistence',
  );

  return lastResponse;
}

async function main() {
  const scenarioKey = process.argv[2] ?? 'happy-phy001';
  const scenario = SCENARIOS[scenarioKey];

  if (!scenario) {
    throw new Error(`Unknown scenario '${scenarioKey}'`);
  }

  scenario.key = scenarioKey;

  let lastResponse;
  let managedRuntime;
  let enrollmentProcess;

  const cleanup = async () => {
    if (runtimeMode === 'managed') {
      await stopProcess(enrollmentProcess);
      await stopProcess(managedRuntime?.certificateProcess);
      await runCommand('npx', ['mb', 'stop', '--port', String(PORTS.mountebankAdmin)], {
        cwd: CERTIFICATE_REPO_ROOT,
        stdio: 'inherit',
      }).catch(() => stopProcess(managedRuntime?.mountebankProcess));
      await stopProcess(managedRuntime?.mountebankProcess);
    }
  };

  process.on('SIGINT', async () => {
    await cleanup();
    process.exit(130);
  });

  process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(143);
  });

  try {
    await assertPathExists();

    if (runtimeMode === 'managed') {
      managedRuntime = await startManagedRuntime();
      logStep(`Loading imposter for scenario '${scenarioKey}'`);
      await runCommand('node', ['scripts/mountebank/load-imposter.js', scenario.imposter], {
        cwd: CERTIFICATE_REPO_ROOT,
        stdio: 'inherit',
      });
      if (scenario.mode === 'cross-repo') {
        enrollmentProcess = await startManagedEnrollmentRuntime();
      }
    } else {
      await prepareExternalRuntime(scenario);
    }

    if (scenario.mode === 'service-only') {
      lastResponse = await runServiceOnlyScenario(scenario);
      console.log(`\n[cross-repo] Service-only scenario '${scenarioKey}' passed`);
      console.log(JSON.stringify(lastResponse.body, null, 2));
      return;
    }

    lastResponse = await runCrossRepoScenario(scenario);

    if (scenario.expectedStatus) {
      console.log(`\n[cross-repo] Scenario '${scenarioKey}' passed`);
    } else {
      console.log(`\n[cross-repo] Happy path scenario '${scenarioKey}' passed`);
    }
    console.log(JSON.stringify(lastResponse.body, null, 2));
  } catch (error) {
    console.error('\n[cross-repo] Failure context');
    if (lastResponse) {
      console.error(JSON.stringify(lastResponse, null, 2));
    }
    throw error;
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
