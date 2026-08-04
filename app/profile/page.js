import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/login/actions';
import styles from './profile.module.css';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/profile');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <main className={styles.main}>
      <h1>{profile?.username || user.email}</h1>
      <p className={styles.email}>{user.email}</p>

      <div className={styles.links}>
        <Link href="/rank/anime" className={styles.link}>
          Edit my anime ranking
        </Link>
        <Link href="/rank/opening" className={styles.link}>
          Edit my opening ranking
        </Link>
        <Link href="/rank/ending" className={styles.link}>
          Edit my ending ranking
        </Link>
      </div>

      <form action={signOut}>
        <button type="submit" className={styles.signOut}>
          Sign out
        </button>
      </form>
    </main>
  );
}
