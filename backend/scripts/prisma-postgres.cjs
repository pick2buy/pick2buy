const { spawnSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const backendDir = path.resolve(__dirname, '..');
const localEnvPath = path.join(backendDir, '.env.local');
const localEnv = existsSync(localEnvPath)
  ? dotenv.parse(readFileSync(localEnvPath))
  : {};
const configuredUrl = process.env.DATABASE_URL?.startsWith('postgres')
  ? process.env.DATABASE_URL
  : process.env.POSTGRES_DATABASE_URL || localEnv.POSTGRES_DATABASE_URL;
const command = process.argv.slice(2);
const databaseUrl = configuredUrl || (command[0] === 'generate'
  ? 'postgresql://placeholder:placeholder@localhost:5432/pick2buy'
  : '');

if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  console.error('Set POSTGRES_DATABASE_URL in backend/.env.local or DATABASE_URL in the deployment environment.');
  process.exit(1);
}

const prismaCli = path.resolve(backendDir, '..', 'node_modules', 'prisma', 'build', 'index.js');
const result = spawnSync(process.execPath, [prismaCli, ...command], {
  cwd: backendDir,
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: 'inherit',
});

if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
