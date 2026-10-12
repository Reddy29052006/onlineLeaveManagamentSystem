export default function StatusBadge({ status }) {
  const styles =
    status === 'active'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
}