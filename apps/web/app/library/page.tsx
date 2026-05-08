import { SiteHeader } from "@/components/SiteHeader";
import { loadPublicWorlds } from "@/lib/worlds/shape";
import { LibraryClient } from "./LibraryClient";

export const revalidate = 60;

export default async function LibraryPage() {
  const worlds = await loadPublicWorlds();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <header className="px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text)" }}
              tabIndex={-1}
              data-focus-on-mount
            >
              Adventure Library
            </h1>
          </div>
        </div>
      </header>

      <LibraryClient initialWorlds={worlds} />
    </div>
  );
}
