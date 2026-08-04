import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sb } from '@/lib/supabase/anon';
import RankingBuilder from '../RankingBuilder';
import { saveThemeRanking } from './actions';
import styles from '../rank.module.css';

function labelFor(theme) {
  const anime = theme.anime?.title ?? 'Unknown';
  return `${anime} — ${theme.theme_type}${theme.sequence_number} — ${theme.title}`;
}

export default async function RankThemePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/rank/theme');

  const [{ data: themes }, { data: ranking }] = await Promise.all([
    sb
      .from('themes')
      .select('id, theme_type, sequence_number, title, artist, anime:anime_id(title)'),
    supabase
      .from('theme_rankings')
      .select(
        'theme_id, placement, theme:theme_id(id, theme_type, sequence_number, title, anime:anime_id(title))'
      )
      .eq('user_id', user.id)
      .order('placement', { ascending: true }),
  ]);

  const candidates = (themes ?? []).map((t) => ({ id: t.id, label: labelFor(t) }));
  const initialRanking = (ranking ?? []).map((r) => ({
    id: r.theme_id,
    label: r.theme ? labelFor(r.theme) : 'Unknown',
  }));

  return (
    <main className={styles.main}>
      <h1>Rank Themes</h1>
      <p className={styles.subtitle}>
        Search for openings and endings to add, then reorder your list.
      </p>
      <RankingBuilder
        entityLabel="themes"
        candidates={candidates}
        initialRanking={initialRanking}
        saveAction={saveThemeRanking}
      />
    </main>
  );
}
