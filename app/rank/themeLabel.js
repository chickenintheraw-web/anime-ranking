export function themeLabel(theme) {
  const anime = theme.anime?.title ?? 'Unknown';
  return `${anime} — ${theme.theme_type}${theme.sequence_number} — ${theme.title}`;
}
