import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sb } from '@/lib/supabase/anon';
import RankingBuilder from '../RankingBuilder';
import { themeLabel } from '../themeLabel';
import { saveOpeningRanking } from './actions';
import styles from '../rank.module.css';

export default async function RankOpeningPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/rank/opening');

  const [{ data: themes }, { data: ranking }] = await Promise.all([
    sb
      .from('themes')
      .select('id, theme_type, sequence_number, title, artist, anime:anime_id(title)')
      .eq('theme_type', 'OP'),
    supabase
      .from('theme_rankings')
      .select(
        'theme_id, placement, theme:theme_id(id, theme_type, sequence_number, title, anime:anime_id(title))'
      )
      .eq('user_id', user.id)
      .order('placement', { ascending: true }),
  ]);

  const openingRanking = (ranking ?? []).filter((r) => r.theme?.theme_type === 'OP');

  const candidates = (themes ?? []).map((t) => ({ id: t.id, label: themeLabel(t) }));
  const initialRanking = openingRanking.map((r) => ({
    id: r.theme_id,
    label: r.theme ? themeLabel(r.theme) : 'Unknown',
  }));

  return (
    <main className={styles.main}>
      <h1>Rank Openings</h1>
      <p className={styles.subtitle}>
        Search for opening themes to add, then reorder your list.
      </p>
      <RankingBuilder
        entityLabel="openings"
        candidates={candidates}
        initialRanking={initialRanking}
        saveAction={saveOpeningRanking}
      />
    </main>
  );
}
