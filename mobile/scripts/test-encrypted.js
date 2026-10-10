#!/usr/bin/env node
/* eslint-env node */
// Runs the Jest suite with structured-data encryption forced ON (AWA_STRUCTURED_ENCRYPTION=1, see jest.setup.js), so
// every store/screen test exercises the AES-256-GCM envelope path of services/secureAsyncStorage.ts instead of the
// plaintext default. Cross-platform replacement for `AWA_STRUCTURED_ENCRYPTION=1 jest` (which cmd/PowerShell lack).
// Usage: npm run test:encrypted [-- <any jest args, e.g. a path or -t "name">]
// See docs/security/encrypted-test-compatibility.md.
const {spawnSync} = require('child_process');
const path = require('path');

const jestBin = require.resolve('jest/bin/jest');
const result = spawnSync(process.execPath, [jestBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
  env: {...process.env, AWA_STRUCTURED_ENCRYPTION: '1'},
});
process.exit(result.status === null ? 1 : result.status);
