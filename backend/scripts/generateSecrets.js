import { readFileSync, writeFileSync } from 'fs';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
let env = readFileSync(envPath, 'utf8');
env = env.replace('__GENERATE__', randomBytes(48).toString('hex'));
env = env.replace('__GENERATE_REFRESH__', randomBytes(48).toString('hex'));
writeFileSync(envPath, env, 'utf8');
console.log('Generated JWT secrets into backend/.env');
