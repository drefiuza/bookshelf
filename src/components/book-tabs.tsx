"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { BookCard } from "./book-card";
import type { Book, BookWithFavoriteCount, OpenLibraryDoc } from "@/lib/types";

function parseBooks(docs: OpenLibraryDoc[]): Book[] {
  return docs.map((doc) => ({
    id: doc.key,
    title: doc.title,
    author_name: doc.author_name?.join(", ") ?? null,
    cover_i: doc.cover_i ?? null,
    first_publish_year: doc.first_publish_year ?? null,
  }));
}

export function BookTabs({
  classBooks,
  trending: initialTrending,
  userFavoriteIds,
}: {
  classBooks: BookWithFavoriteCount[];
  trending: Book[];
  userFavoriteIds: string[];
}) {
  const [tab, setTab] = useState<"favorites" | "discover">(
    classBooks.length > 0 ? "favorites" : "discover"
  );
  const favoriteSet = new Set(userFavoriteIds);

  // Infinite scroll state for Discover
  const [discoverBooks, setDiscoverBooks] = useState<Book[]>(initialTrending);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/browse?offset=${discoverBooks.length}&limit=20`);
      const data = await res.json();
      const newBooks = parseBooks(data.docs);
      if (newBooks.length === 0) {
        setHasMore(false);
      } else {
        setDiscoverBooks((prev) => [...prev, ...newBooks]);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [discoverBooks.length, isLoadingMore, hasMore]);

  useEffect(() => {
    if (tab !== "discover") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [tab, loadMore]);

  return (
    <div>
      <div className="flex items-center gap-1 border-b border-stone-200 mb-8">
        <button
          onClick={() => setTab("favorites")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "favorites"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-400 hover:text-stone-600"
          }`}
        >
          Class Favorites
          {classBooks.length > 0 && (
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                tab === "favorites"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              {classBooks.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("discover")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "discover"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-400 hover:text-stone-600"
          }`}
        >
          Discover
        </button>
      </div>

      {tab === "favorites" && (
        <>
          {classBooks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-stone-400 text-lg">
                No favorites yet — be the first!
              </p>
              <button
                onClick={() => setTab("discover")}
                className="mt-3 text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                Browse trending books
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {classBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isFavorited={favoriteSet.has(book.id)}
                  favoriteCount={book.favorite_count}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "discover" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {discoverBooks.map((book, i) => (
              <BookCard
                key={`${book.id}-${i}`}
                book={book}
                isFavorited={favoriteSet.has(book.id)}
                showFavoriteButton={isSignedIn}
              />
            ))}
          </div>
          {hasMore && (
            <div ref={loaderRef} className="flex justify-center py-10">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-stone-400 text-sm">
                  <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                  Loading more books...
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
