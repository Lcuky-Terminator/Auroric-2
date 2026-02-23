import { NextResponse } from 'next/server';
import { getAllUsers, getBlockedUsers } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const users = await getAllUsers();
    const currentUser = await getCurrentUser();

    if (currentUser) {
      // Get all block entries where current user is involved
      const blockedByMe = await getBlockedUsers(currentUser.id);
      const blockedByMeIds = new Set(blockedByMe.map(b => b.blockedId));

      // To find users who blocked me, we can either fetch all or just filter.
      // For efficiency in this app, we'll fetch them by looking at the DB or 
      // just dynamically filtering later.
      // Actually, since we don't have a `getBlockers` function easily without querying,
      // let's add `getBlockers` to db.ts first, or just filter out the ones we blocked.
      // Wait, let me just add a quick query for `blockedId === currentUser.id`.
      const { databases, DB_ID, BLOCKED_USERS_COL } = await import('@/lib/appwrite');
      const { Query } = await import('node-appwrite');
      const { documents } = await databases.listDocuments(DB_ID, BLOCKED_USERS_COL, [
        Query.equal('blockedId', currentUser.id),
        Query.limit(100)
      ]);
      const blockedMeIds = new Set(documents.map(d => d.blockerId));

      // Filter out users
      const filteredUsers = users.filter(u =>
        !blockedByMeIds.has(u.id) && !blockedMeIds.has(u.id)
      );
      return NextResponse.json(filteredUsers);
    }

    return NextResponse.json(users);
  } catch (err) {
    console.error('[API] GET /api/users error:', err);
    return NextResponse.json([]);
  }
}
