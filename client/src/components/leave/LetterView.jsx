import { Download, Loader2, Printer } from 'lucide-react';

/**
 * Renders the server-generated letter content on a paper-like sheet with
 * print styling. The sheet is the only element printed (see index.css).
 */
export default function LetterView({
  content,
  title = 'Formal Leave Application Letter',
  onDownloadPdf,
  downloading = false,
}) {
  if (!content) return null;

  return (
    <div className="space-y-3">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">Official archived letterhead document</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Printer className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Print Letter
          </button>

          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-2xs transition-colors disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download PDF
            </button>
          )}
        </div>
      </div>

      <div className="letter-sheet rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xs">
        <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-slate-800">
          {content}
        </pre>
      </div>
    </div>
  );
}
