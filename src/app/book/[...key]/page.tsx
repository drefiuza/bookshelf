import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";
import { FavoriteButton } from "@/components/favorite-button";
import type { Book } from "@/lib/types";

interface WorkData {
  title: string;
  description?: string | { value: string };
  covers?: number[];
  subjects?: string[];
  first_publish_date?: string;
}

interface AuthorEntry {
  author: { key: string };
}

interface AuthorData {
  name: string;
  bio?: string | { value: string };
  birth_date?: string;
}

async function getWorkDetails(key: string) {
  const res = await fetch(`https://openlibrary.org${key}.json`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json() as Promise<WorkData>;
}

async function getAuthors(key: string): Promise<string[]> {
  const res = await fetch(`https://openlibrary.org${key}.json`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const authorKeys: string[] = (data.authors || []).map(
    (a: AuthorEntry) => a.author?.key
  ).filter(Boolean);

  const names = await Promise.all(
    authorKeys.map(async (aKey: string) => {
      const aRes = await fetch(`https://openlibrary.org${aKey}.json`, {
        next: { revalidate: 3600 },
      });
      if (!aRes.ok) return null;
      const aData: AuthorData = await aRes.json();
      return aData.name;
    })
  );
  return names.filter(Boolean) as string[];
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ key: string[] }>;
}) {
  const { key } = await params;
  const workKey = "/" + key.join("/");

  const [work, authors] = await Promise.all([
    getWorkDetails(workKey),
    getAuthors(workKey),
  ]);

  if (!work) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-stone-400 text-lg">Book not found</p>
        <Link href="/" className="text-amber-600 text-sm mt-2 inline-block">
          Back to bookshelf
        </Link>
      </div>
    );
  }

  const { userId } = await auth();

  // Try Works API covers first, fall back to Supabase cached cover_i
  let coverId = work.covers?.find((c) => c > 0) ?? null;
  if (!coverId) {
    const { data: dbBook } = await supabaseAdmin
      .from("books")
      .select("cover_i")
      .eq("id", workKey)
      .single();
    coverId = dbBook?.cover_i ?? null;
  }
  const coverUrl = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : null;

  const description =
    typeof work.description === "string"
      ? work.description
      : work.description?.value ?? null;

  // Check if user has favorited
  let isFavorited = false;
  if (userId) {
    const { data } = await supabaseAdmin
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("book_id", workKey)
      .single();
    isFavorited = !!data;
  }

  // Get favorite count
  const { count } = await supabaseAdmin
    .from("favorites")
    .select("id", { count: "exact", head: true })
    .eq("book_id", workKey);

  const book: Book = {
    id: workKey,
    title: work.title,
    author_name: authors.join(", ") || null,
    cover_i: coverId ?? null,
    first_publish_year: work.first_publish_date
      ? parseInt(work.first_publish_date)
      : null,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 mb-8"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <div className="flex flex-col sm:flex-row gap-8">
        {/* Cover */}
        <div className="shrink-0">
          <div className="relative w-48 aspect-[2/3] rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-stone-100 to-stone-50">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={work.title}
                fill
                className="object-cover"
                sizes="192px"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-stone-400 text-4xl">
                📖
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-stone-900 leading-tight">
            {work.title}
          </h1>
          {authors.length > 0 && (
            <p className="text-lg text-stone-500 mt-1">{authors.join(", ")}</p>
          )}
          {work.first_publish_date && (
            <p className="text-sm text-stone-400 mt-1">
              First published {work.first_publish_date}
            </p>
          )}

          <div className="flex items-center gap-4 mt-5">
            {userId && (
              <FavoriteButton book={book} initialFavorited={isFavorited} />
            )}
            {(count ?? 0) > 0 && (
              <span className="text-sm text-stone-500">
                {count} {count === 1 ? "classmate" : "classmates"} favorited
                this
              </span>
            )}
          </div>

          {description && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-2">
                About this book
              </h2>
              <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          )}

          {work.subjects && work.subjects.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-2">
                Subjects
              </h2>
              <div className="flex flex-wrap gap-2">
                {work.subjects.slice(0, 12).map((subject) => (
                  <span
                    key={subject}
                    className="px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
