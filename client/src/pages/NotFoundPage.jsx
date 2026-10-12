import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center text-slate-800">
      <FileQuestion className="mb-4 h-12 w-12 text-slate-400" aria-hidden="true" />
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        Back to home
      </Link>
    </main>
  );
}
