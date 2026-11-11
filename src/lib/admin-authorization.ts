import { auth } from '@/lib/auth';
import { check, db } from '@/lib/whatsapp/server';

/** Recheck the database role for every privileged operation. */
export async function authenticatedAdmin() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;
  const result = await db().from('users').select('id,role').eq('id', session.user.id).eq('email', session.user.email).maybeSingle();
  check(result.error);
  return result.data?.role === 'admin' ? session : null;
}
