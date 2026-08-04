import { redirect } from 'next/navigation';

export default function AnimeIndexPage() {
  redirect('/search?type=anime');
}
