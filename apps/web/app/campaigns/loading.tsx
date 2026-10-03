/** Shown while the page's data loads (uses the .skeleton shimmer from globals.css). */
export default function Loading() {
  return (
    <main id="main-content" className="mx-auto max-w-4xl px-6 py-10" aria-busy="true">
      <p role="status" className="sr-only">Loading…</p>
      <div className="skeleton h-8 w-1/2 rounded" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-40 rounded-xl" />
        ))}
      </div>
    </main>
  );
}
