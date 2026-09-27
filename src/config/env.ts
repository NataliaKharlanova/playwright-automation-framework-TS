import dotenv from 'dotenv';
import path from 'path';

const envName = process.env.ENV ?? 'qa';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${envName}`) });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env variable: ${name} (check .env.${envName})`);
  }
  return value;
}

export const env = {
  name: envName,
  baseUrl: required('BASE_URL'),
  apiUrl: required('API_URL'),
  user: {
    username: required('USERNAME'),
    password: required('PASSWORD'),
  },
} as const;