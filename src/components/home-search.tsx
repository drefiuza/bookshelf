"use client";

import { useState } from "react";
import { BookCard } from "@/components/book-card";
import type { Book, OpenLibraryDoc } from "@/lib/types";

export function HomeSearchBar({
  initialFavoriteIds,
}: {
  initialFavoriteIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const favoriteSet = new Set(initialFavoriteIds);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      const books: Book[] = data.docs.map((doc: OpenLibraryDoc) => ({
        id: doc.key,
        title: doc.title,
        author_name: doc.author_name?.join(", ") ?? null,
        cover_i: doc.cover_i ?? null,
        first_publish_year: doc.first_publish_year ?? null,
      }));
      setResults(books);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Search form — rendered in the hero */}
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, or topic..."
            className="w-full rounded-full bg-white/10 border border-white/20 pl-11 pr-4 py-3 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white/15 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-6 py-3 rounded-full bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "..." : "Search"}
        </button>
      </form>

      {/* Search results — rendered below the hero via a full-width breakout */}
      {hasSearched && (
        <div className="fixed-below-hero">
          <div className="w-screen relative left-1/2 -translate-x-1/2 bg-stone-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-stone-200 bg-white overflow-hidden animate-pulse"
                    >
                      <div className="aspect-[2/3] bg-gradient-to-br from-stone-100 to-stone-50" />
                      <div className="p-3">
                        <div className="h-4 bg-stone-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-stone-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <p className="text-stone-500 text-sm text-center py-8">
                  No results found — try a different search
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-stone-900">
                      Search Results
                      <span className="ml-2 text-sm font-normal text-stone-500">
                        {results.length} {results.length === 1 ? "book" : "books"}
                      </span>
                    </h2>
                    <button
                      onClick={() => {
                        setHasSearched(false);
                        setResults([]);
                        setQuery("");
                      }}
                      className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
                    >
                      Clear search
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {results.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        isFavorited={favoriteSet.has(book.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
