import { Loader2 } from 'lucide-react';

export default function FullPageSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 text-slate-600">
      <span className="flex items-center gap-2 text-sm">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        {label}
      </span>
    </div>
  );
}
