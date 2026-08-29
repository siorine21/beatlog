/**
 * 今日の日付（YYYY-MM-DD、ローカルタイムゾーン基準）。
 * db.ts は IndexedDB を読み込むため、日付だけが要る画面から使えるよう切り出してある。
 */
export function today(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
