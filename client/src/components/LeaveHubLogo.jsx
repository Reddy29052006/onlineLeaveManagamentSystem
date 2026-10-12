export default function LeaveHubLogo({ light = false, compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Stylized LeafHub icon: 3 leaves (emerald & blue) */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60 p-1">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
        >
          {/* Central green leaf */}
          <path
            d="M20 6C20 6 24 13 24 18C24 20.2 22.2 22 20 22C17.8 22 16 20.2 16 18C16 13 20 6 20 6Z"
            fill="#10B981"
          />
          {/* Left blue leaf */}
          <path
            d="M20 22C20 22 13 22 9 17C7.5 15.1 8 12.3 10 11C12.3 9.5 17 14 20 22Z"
            fill="#2563EB"
          />
          {/* Right blue leaf */}
          <path
            d="M20 22C20 22 27 22 31 17C32.5 15.1 32 12.3 30 11C27.7 9.5 23 14 20 22Z"
            fill="#3B82F6"
          />
          {/* Base stem */}
          <path
            d="M19 22H21V33C21 33.6 20.6 34 20 34C19.4 34 19 33.6 19 33V22Z"
            fill="#059669"
          />
        </svg>
      </div>

      {!compact && (
        <div className="flex flex-col">
          <span
            className={`text-lg font-bold tracking-tight leading-tight ${
              light ? 'text-white' : 'text-[#182848]'
            }`}
          >
            Leave<span className="text-blue-600">Hub</span>
          </span>
          <span
            className={`text-[10px] font-medium leading-none ${
              light ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Online Leave Management System
          </span>
        </div>
      )}
    </div>
  );
}
