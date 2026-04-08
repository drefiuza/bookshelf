import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { HomeSearchBar } from "@/components/home-search";
import { BookTabs } from "@/components/book-tabs";
import type { Book, BookWithFavoriteCount, OpenLibraryDoc } from "@/lib/types";

async function getTrendingBooks(): Promise<Book[]> {
  const res = await fetch(
    "https://openlibrary.org/search.json?q=subject:fiction&sort=rating&limit=10",
    { next: { revalidate: 3600 } }
  );
  const data = await res.json();
  return data.docs
    .filter((doc: OpenLibraryDoc) => doc.cover_i)
    .slice(0, 10)
    .map((doc: OpenLibraryDoc) => ({
      id: doc.key,
      title: doc.title,
      author_name: doc.author_name?.join(", ") ?? null,
      cover_i: doc.cover_i ?? null,
      first_publish_year: doc.first_publish_year ?? null,
    }));
}

export default async function Home() {
  const { userId } = await auth();

  // Get class favorites
  const { data } = await supabaseAdmin
    .from("favorites")
    .select("book_id, books(id, title, author_name, cover_i, first_publish_year)");

  const countMap = new Map<string, BookWithFavoriteCount>();
  for (const fav of data || []) {
    const b = fav.books as unknown as {
      id: string;
      title: string;
      author_name: string | null;
      cover_i: number | null;
      first_publish_year: number | null;
    };
    if (!b) continue;
    const existing = countMap.get(b.id);
    if (existing) {
      existing.favorite_count++;
    } else {
      countMap.set(b.id, { ...b, favorite_count: 1 });
    }
  }
  const classBooks = Array.from(countMap.values()).sort(
    (a, b) => b.favorite_count - a.favorite_count
  );

  // Get user's favorites
  let userFavoriteIds: string[] = [];
  if (userId) {
    const { data: favs } = await supabaseAdmin
      .from("favorites")
      .select("book_id")
      .eq("user_id", userId);
    userFavoriteIds = (favs || []).map((f) => f.book_id);
  }
  // Get trending books
  const trending = await getTrendingBooks();

  return (
    <div>
      {/* Hero with search */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 to-stone-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,53,15,0.15),transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-6 py-8 sm:py-12">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              What&apos;s everyone reading?
            </h1>
            <p className="mt-3 text-stone-400 text-lg">
              Search books, favorite the ones you love, and see what the class is into.
            </p>
            <div className="mt-6 w-full max-w-2xl">
              <HomeSearchBar
                isSignedIn={!!userId}
                initialFavoriteIds={userFavoriteIds}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <BookTabs
          classBooks={classBooks}
          trending={trending}
          userFavoriteIds={userFavoriteIds}
          isSignedIn={!!userId}
        />
      </div>
    </div>
  );
}
