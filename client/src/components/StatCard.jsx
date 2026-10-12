const TONES = {
  blue: {
    bg: 'bg-blue-50/70 border-blue-100 hover:border-blue-200',
    iconBg: 'bg-blue-100 text-blue-600',
    numColor: 'text-slate-900',
    labelColor: 'text-slate-800',
    subColor: 'text-slate-500',
  },
  green: {
    bg: 'bg-emerald-50/70 border-emerald-100 hover:border-emerald-200',
    iconBg: 'bg-emerald-100 text-emerald-600',
    numColor: 'text-slate-900',
    labelColor: 'text-slate-800',
    subColor: 'text-slate-500',
  },
  amber: {
    bg: 'bg-amber-50/70 border-amber-100 hover:border-amber-200',
    iconBg: 'bg-amber-100 text-amber-600',
    numColor: 'text-slate-900',
    labelColor: 'text-slate-800',
    subColor: 'text-slate-500',
  },
  rose: {
    bg: 'bg-rose-50/70 border-rose-100 hover:border-rose-200',
    iconBg: 'bg-rose-100 text-rose-600',
    numColor: 'text-slate-900',
    labelColor: 'text-slate-800',
    subColor: 'text-slate-500',
  },
  purple: {
    bg: 'bg-purple-50/70 border-purple-100 hover:border-purple-200',
    iconBg: 'bg-purple-100 text-purple-600',
    numColor: 'text-slate-900',
    labelColor: 'text-slate-800',
    subColor: 'text-slate-500',
  },
};

export default function StatCard({
  label,
  value,
  subtitle,
  sublabel,
  icon: Icon,
  tone,
  color,
}) {
  const chosenTone = color || tone || 'blue';
  const t = TONES[chosenTone] || TONES.blue;
  const subText = subtitle || sublabel;

  return (
    <div
      className={`rounded-xl border p-3.5 sm:p-4 shadow-2xs transition-all hover:-translate-y-0.5 hover:shadow-xs ${t.bg}`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-2xs ${t.iconBg}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-2xl font-bold tracking-tight leading-none ${t.numColor}`}>{value ?? 0}</p>
          <p className={`mt-1 text-xs font-semibold truncate ${t.labelColor}`}>{label}</p>
          {subText && <p className={`text-[11px] font-medium truncate mt-0.5 ${t.subColor}`}>{subText}</p>}
        </div>
      </div>
    </div>
  );
}
