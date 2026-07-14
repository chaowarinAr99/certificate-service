const { spawn } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const collectionRoot = path.join(repoRoot, 'bruno/certificate-service');
const runtimeMode = process.env.API_TEST_RUNTIME_MODE || 'managed';

const SCENARIO_GROUPS = {
  all: [
    { folder: 'health/Health_Check.bru' },
    {
      imposter: 'mountebank/imposters/success.json',
      folder: 'certificates/success/TC01_Create_Certificate_Success_course_PHY001.bru',
    },
    {
      imposter: 'mountebank/imposters/success.json',
      folder: 'certificates/success/TC02_Create_Certificate_Success_course_CHE001.bru',
    },
    {
      imposter: 'mountebank/imposters/success.json',
      folder: 'certificates/success/TC03_Create_Certificate_Success_course_COM001.bru',
    },
    { folder: 'certificates/alternative/TC04_Create_Certificate_Bad_Request_Missing_RefId.bru' },
    { folder: 'certificates/alternative/TC05_Create_Certificate_Bad_Request_Missing_LearnerId.bru' },
    { folder: 'certificates/alternative/TC06_Create_Certificate_Bad_Request_Missing_CourseRef.bru' },
    { folder: 'certificates/alternative/TC13_Create_Certificate_Bad_Request_Empty_RefId.bru' },
    { folder: 'certificates/alternative/TC14_Create_Certificate_Bad_Request_Empty_LearnerId.bru' },
    { folder: 'certificates/alternative/TC15_Create_Certificate_Bad_Request_Empty_CourseRef.bru' },
    { folder: 'certificates/alternative/TC16_Create_Certificate_Bad_Request_Whitespace_RefId.bru' },
    { folder: 'certificates/alternative/TC17_Create_Certificate_Bad_Request_Whitespace_LearnerId.bru' },
    { folder: 'certificates/alternative/TC18_Create_Certificate_Bad_Request_Whitespace_CourseRef.bru' },
    {
      imposter: 'mountebank/imposters/non-2xx.json',
      folder: 'certificates/alternative/TC07_Create_Certificate_Upstream_Api_Error.bru',
    },
    {
      imposter: 'mountebank/imposters/missing-certificate-id.json',
      folder: 'certificates/alternative/TC08_Create_Certificate_Invalid_Upstream_Missing_Certificate_Id.bru',
    },
    {
      imposter: 'mountebank/imposters/missing-certificate-url.json',
      folder: 'certificates/alternative/TC09_Create_Certificate_Invalid_Upstream_Missing_Certificate_Url.bru',
    },
    {
      imposter: 'mountebank/imposters/missing-issued-at.json',
      folder: 'certificates/alternative/TC10_Create_Certificate_Invalid_Upstream_Missing_Issued_At.bru',
    },
    {
      imposter: 'mountebank/imposters/invalid-status.json',
      folder: 'certificates/alternative/TC11_Create_Certificate_Invalid_Upstream_Status.bru',
    },
    {
      imposter: 'mountebank/imposters/timeout.json',
      folder: 'certificates/alternative/TC12_Create_Certificate_Upstream_Timeout.bru',
    },
  ],
  success: [
    { folder: 'health/Health_Check.bru' },
    {
      imposter: 'mountebank/imposters/success.json',
      folder: 'certificates/success/TC01_Create_Certificate_Success_course_PHY001.bru',
    },
    {
      imposter: 'mountebank/imposters/success.json',
      folder: 'certificates/success/TC02_Create_Certificate_Success_course_CHE001.bru',
    },
    {
      imposter: 'mountebank/imposters/success.json',
      folder: 'certificates/success/TC03_Create_Certificate_Success_course_COM001.bru',
    },
  ],
  alternative: [
    { folder: 'certificates/alternative/TC04_Create_Certificate_Bad_Request_Missing_RefId.bru' },
    { folder: 'certificates/alternative/TC05_Create_Certificate_Bad_Request_Missing_LearnerId.bru' },
    { folder: 'certificates/alternative/TC06_Create_Certificate_Bad_Request_Missing_CourseRef.bru' },
    { folder: 'certificates/alternative/TC13_Create_Certificate_Bad_Request_Empty_RefId.bru' },
    { folder: 'certificates/alternative/TC14_Create_Certificate_Bad_Request_Empty_LearnerId.bru' },
    { folder: 'certificates/alternative/TC15_Create_Certificate_Bad_Request_Empty_CourseRef.bru' },
    { folder: 'certificates/alternative/TC16_Create_Certificate_Bad_Request_Whitespace_RefId.bru' },
    { folder: 'certificates/alternative/TC17_Create_Certificate_Bad_Request_Whitespace_LearnerId.bru' },
    { folder: 'certificates/alternative/TC18_Create_Certificate_Bad_Request_Whitespace_CourseRef.bru' },
    {
      imposter: 'mountebank/imposters/non-2xx.json',
      folder: 'certificates/alternative/TC07_Create_Certificate_Upstream_Api_Error.bru',
    },
    {
      imposter: 'mountebank/imposters/missing-certificate-id.json',
      folder: 'certificates/alternative/TC08_Create_Certificate_Invalid_Upstream_Missing_Certificate_Id.bru',
    },
    {
      imposter: 'mountebank/imposters/missing-certificate-url.json',
      folder: 'certificates/alternative/TC09_Create_Certificate_Invalid_Upstream_Missing_Certificate_Url.bru',
    },
    {
      imposter: 'mountebank/imposters/missing-issued-at.json',
      folder: 'certificates/alternative/TC10_Create_Certificate_Invalid_Upstream_Missing_Issued_At.bru',
    },
    {
      imposter: 'mountebank/imposters/invalid-status.json',
      folder: 'certificates/alternative/TC11_Create_Certificate_Invalid_Upstream_Status.bru',
    },
    {
      imposter: 'mountebank/imposters/timeout.json',
      folder: 'certificates/alternative/TC12_Create_Certificate_Upstream_Timeout.bru',
    },
  ],
};

function spawnProcess(command, args, options = {}) {
  return spawn(command, args, {
    cwd: repoRoot,
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

async function waitForHttp(url, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${url}`);
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

async function main() {
  const mode = process.argv[2] ?? 'all';
  const scenarios = SCENARIO_GROUPS[mode];

  if (!scenarios) {
    throw new Error(`Unknown Bruno scenario group '${mode}'`);
  }

  const mbProcess = runtimeMode === 'managed'
    ? spawnProcess('npx', ['mb', 'start', '--port', '2525', '--pidfile', '.mb.pid', '--loglevel', 'warn'])
    : undefined;
  let serviceProcess;

  try {
    await waitForHttp('http://127.0.0.1:2525/imposters', 15000);

    if (runtimeMode === 'managed') {
      serviceProcess = spawnProcess('npm', ['run', 'start:api-test'], {
        env: {
          ...process.env,
          PORT: '4000',
          EXTERNAL_CERTIFICATE_API_URL: 'http://localhost:5500/provider/certificates',
          EXTERNAL_CERTIFICATE_API_TIMEOUT_MS: '1000',
        },
      });
    }

    try {
      await waitForHttp('http://127.0.0.1:4000/health', 20000);

      for (const scenario of scenarios) {
        if (scenario.imposter) {
          await runCommand('node', ['scripts/mountebank/load-imposter.js', scenario.imposter], {
            cwd: repoRoot,
            stdio: 'inherit',
          });
        }

        await runCommand('npx', ['bru', 'run', scenario.folder, '--env-file', 'environments/ci.bru'], {
          cwd: collectionRoot,
          stdio: 'inherit',
        });
      }
    } finally {
      if (runtimeMode === 'managed') {
        await stopProcess(serviceProcess);
      }
    }
  } finally {
    if (runtimeMode === 'managed') {
      await runCommand('npx', ['mb', 'stop', '--port', '2525'], {
        cwd: repoRoot,
        stdio: 'inherit',
      }).catch(() => stopProcess(mbProcess));

      await stopProcess(mbProcess);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
