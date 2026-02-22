/**
 * Appwrite Database & Storage Setup Script
 * Run once: node --import tsx scripts/setup-appwrite.ts
 *
 * Creates: database, collections (users, pins, boards, notifications),
 * all attributes, indexes, and the storage bucket.
 *
 * NOTE: Attribute string sizes are conservative to stay within Appwrite Cloud
 * free-tier row-size limits (~16 383 chars of total string attrs per collection,
 * because MariaDB utf8mb4 uses 4 bytes per char with a 65 535 byte row limit).
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { Client, Databases, Storage, IndexType, OrderBy } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const storageClient = new Storage(client);

const DB_ID = process.env.APPWRITE_DATABASE_ID || 'auroric-db';
const BUCKET_ID = process.env.APPWRITE_BUCKET_ID || 'auroric-images';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── helpers ───────────────────────────────────────────────────────────
async function str(col: string, key: string, size: number, required = false, def?: string) {
  try {
    await databases.createStringAttribute(DB_ID, col, key, size, required, def);
    console.log(`  + ${col}.${key} (str ${size})`);
  } catch (e: any) {
    if (e.code === 409) console.log(`  ~ ${col}.${key} exists`);
    else console.error(`  x ${col}.${key} ERR [${e.code}]:`, e.message);
  }
  await sleep(600);
}

async function bool(col: string, key: string, required = false, def?: boolean) {
  try {
    await databases.createBooleanAttribute(DB_ID, col, key, required, def);
    console.log(`  + ${col}.${key} (bool)`);
  } catch (e: any) {
    if (e.code === 409) console.log(`  ~ ${col}.${key} exists`);
    else console.error(`  x ${col}.${key} ERR [${e.code}]:`, e.message);
  }
  await sleep(600);
}

async function int(col: string, key: string, required = false, min?: number, max?: number, def?: number) {
  try {
    await databases.createIntegerAttribute(DB_ID, col, key, required, min, max, def);
    console.log(`  + ${col}.${key} (int)`);
  } catch (e: any) {
    if (e.code === 409) console.log(`  ~ ${col}.${key} exists`);
    else console.error(`  x ${col}.${key} ERR [${e.code}]:`, e.message);
  }
  await sleep(600);
}

async function idx(col: string, key: string, type: IndexType = IndexType.Key, attributes: string[] = [key], orders?: OrderBy[]) {
  try {
    await databases.createIndex(DB_ID, col, `idx_${key}`, type, attributes, orders);
    console.log(`  + idx ${col}.${key}`);
  } catch (e: any) {
    if (e.code === 409) console.log(`  ~ idx ${col}.${key} exists`);
    else console.error(`  x idx ${col}.${key} ERR [${e.code}]:`, e.message);
  }
  await sleep(600);
}

// ─── main ──────────────────────────────────────────────────────────────
async function main() {
  console.log('Setting up Appwrite for Auroric...\n');

  // ── 1. Database ──
  try {
    await databases.create(DB_ID, 'Auroric DB');
    console.log('OK Database created');
  } catch (e: any) {
    if (e.code === 409 || e.message?.includes('maximum')) console.log('OK Database exists');
    else throw e;
  }

  // ── 2. Delete broken collections so we can recreate with correct sizes ──
  const collectionIds = ['users', 'pins', 'boards', 'notifications'];
  for (const id of collectionIds) {
    try {
      await databases.deleteCollection(DB_ID, id);
      console.log(`DEL Deleted collection "${id}"`);
    } catch (e: any) {
      if (e.code === 404) console.log(`SKIP Collection "${id}" didn't exist`);
      else console.error(`  x delete ${id} ERR:`, e.message);
    }
    await sleep(1000);
  }
  // wait a bit for deletions to propagate
  console.log('Waiting for deletions...');
  await sleep(3000);

  // ── 3. Recreate collections ──
  for (const id of collectionIds) {
    try {
      await databases.createCollection(DB_ID, id, id.charAt(0).toUpperCase() + id.slice(1));
      console.log(`OK Collection "${id}" created`);
    } catch (e: any) {
      if (e.code === 409) console.log(`SKIP Collection "${id}" exists`);
      else throw e;
    }
    await sleep(600);
  }

  // ── 4. Attributes ──
  // Budget per collection: ~16 000 chars of string attrs (65535 / 4)
  console.log('\nUsers attributes...');
  // username(50) + displayName(100) + email(200) + bio(500) + avatar(500)
  // + website(500) + passwordHash(256) + createdAt(30) + settingsTheme(10)
  // + followersJson(4000) + followingJson(4000) = 10 146 chars OK
  await str('users', 'username', 50, true);
  await str('users', 'displayName', 100, true);
  await str('users', 'email', 200, true);
  await str('users', 'bio', 500, false, '');
  await str('users', 'avatar', 500, false, '');
  await str('users', 'website', 500, false, '');
  await str('users', 'passwordHash', 256, true);
  await str('users', 'createdAt', 30, true);
  await str('users', 'followersJson', 4000, false, '[]');
  await str('users', 'followingJson', 4000, false, '[]');
  await bool('users', 'settingsPrivateProfile', false, false);
  await bool('users', 'settingsShowActivity', false, true);
  await bool('users', 'settingsAllowMessages', false, true);
  await bool('users', 'settingsAllowNotifications', false, true);
  await bool('users', 'settingsEmailOnNewFollower', false, false);
  await bool('users', 'settingsEmailOnPinInteraction', false, false);
  await str('users', 'settingsTheme', 10, false, 'dark');
  await bool('users', 'emailVerified', false, false);
  console.log('  DONE Users\n');

  console.log('Pins attributes...');
  // title(200) + description(500) + imageUrl(500) + sourceUrl(500)
  // + authorId(36) + boardId(36) + category(50) + createdAt(30)
  // + tagsJson(1000) + likesJson(4000) + savesJson(4000)
  // + commentsJson(4000) = 14 856 chars OK
  await str('pins', 'title', 200, true);
  await str('pins', 'description', 500, false, '');
  await str('pins', 'imageUrl', 500, true);
  await str('pins', 'sourceUrl', 500, false, '');
  await str('pins', 'authorId', 36, true);
  await str('pins', 'boardId', 36, false, '');
  await str('pins', 'category', 50, false, 'All');
  await str('pins', 'createdAt', 30, true);
  await str('pins', 'updatedAt', 30, false, '');
  await int('pins', 'views', false, 0, undefined, 0);
  await bool('pins', 'isPrivate', false, false);
  await str('pins', 'tagsJson', 1000, false, '[]');
  await str('pins', 'likesJson', 4000, false, '[]');
  await str('pins', 'savesJson', 4000, false, '[]');
  await str('pins', 'commentsJson', 4000, false, '[]');
  console.log('  DONE Pins\n');

  console.log('Boards attributes...');
  // name(200) + description(500) + coverImage(500) + ownerId(36)
  // + category(50) + createdAt(30) + updatedAt(30) + pinIdsJson(4000)
  // + followersJson(2000) + collaboratorsJson(2000) = 9 346 chars OK
  await str('boards', 'name', 200, true);
  await str('boards', 'description', 500, false, '');
  await str('boards', 'coverImage', 500, false, '');
  await str('boards', 'ownerId', 36, true);
  await str('boards', 'category', 50, false, 'All');
  await str('boards', 'createdAt', 30, true);
  await str('boards', 'updatedAt', 30, true);
  await bool('boards', 'isPrivate', false, false);
  await str('boards', 'pinIdsJson', 4000, false, '[]');
  await str('boards', 'followersJson', 2000, false, '[]');
  await str('boards', 'collaboratorsJson', 2000, false, '[]');
  console.log('  DONE Boards\n');

  console.log('Notifications attributes...');
  await str('notifications', 'type', 20, true);
  await str('notifications', 'fromUserId', 36, true);
  await str('notifications', 'toUserId', 36, true);
  await str('notifications', 'pinId', 36, false, '');
  await str('notifications', 'boardId', 36, false, '');
  await str('notifications', 'message', 500, true);
  await bool('notifications', 'read', false, false);
  await str('notifications', 'createdAt', 30, true);
  console.log('  DONE Notifications\n');

  // Wait for attrs to deploy
  console.log('Waiting for attributes to deploy...');
  await sleep(5000);

  // ── 5. Indexes ──
  console.log('Creating indexes...');
  await idx('users', 'username', IndexType.Unique);
  await idx('users', 'email', IndexType.Unique);
  await idx('pins', 'authorId');
  await idx('pins', 'boardId');
  await idx('pins', 'category');
  await idx('pins', 'createdAt', IndexType.Key, ['createdAt'], [OrderBy.Desc]);
  await idx('boards', 'ownerId');
  await idx('notifications', 'toUserId');
  await idx('notifications', 'createdAt', IndexType.Key, ['createdAt'], [OrderBy.Desc]);
  console.log('  DONE Indexes\n');

  // ── 6. Storage Bucket ──
  try {
    await storageClient.createBucket(
      BUCKET_ID,
      'Auroric Images',
      undefined,
      false,
      true,
      10 * 1024 * 1024,
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    );
    console.log('OK Storage bucket created');
  } catch (e: any) {
    if (e.code === 409 || e.message?.includes('maximum')) {
      console.log('OK Storage bucket already exists');
    } else throw e;
  }

  console.log('\nAppwrite setup complete!');
}

main().catch(e => {
  console.error('Setup failed:', e.message);
  process.exit(1);
});
