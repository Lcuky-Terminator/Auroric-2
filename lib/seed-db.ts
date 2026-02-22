import { generateSeedData } from './seed-data';
import { hashPassword } from './auth';
import { seedDatabase, isSeeded, type ServerUser } from './db';

export function generateBackendSeedData() {
  const { users, pins, boards, notifications } = generateSeedData();
  const defaultHash = hashPassword('password123');

  const serverUsers: ServerUser[] = users.map(u => ({
    ...u,
    passwordHash: defaultHash,
  }));

  return { users: serverUsers, pins, boards, notifications };
}

export async function seedIfEmpty(): Promise<boolean> {
  if (await isSeeded()) return false;
  const data = generateBackendSeedData();
  await seedDatabase(data);
  return true;
}
