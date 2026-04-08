"use client";

import { useTransition, useState } from "react";
import { toggleFavorite } from "@/lib/actions";
import type { Book } from "@/lib/types";

export function FavoriteButton({
  book,
  initialFavorited,
}: {
  book: Book;
  initialFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();
  const [animate, setAnimate] = useState(false);

  function handleClick() {
    if (!favorited) setAnimate(true);
    setFavorited(!favorited);
    startTransition(async () => {
      const result = await toggleFavorite(book);
      setFavorited(result.favorited);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      onAnimationEnd={() => setAnimate(false)}
      className={`transition-transform hover:scale-110 disabled:opacity-50 ${animate ? "animate-[ping_0.3s_ease-out]" : ""}`}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      {favorited ? (
        <svg className="w-5 h-5 text-red-500 fill-current drop-shadow-sm" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-stone-400 hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )}
    </button>
  );
}
