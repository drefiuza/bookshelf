import Image from "next/image";
import Link from "next/link";
import type { Book } from "@/lib/types";
import { FavoriteButton } from "./favorite-button";

export function BookCard({
  book,
  isFavorited,
  favoriteCount,
  showFavoriteButton,
}: {
  book: Book;
  isFavorited: boolean;
  favoriteCount?: number;
  showFavoriteButton: boolean;
}) {
  const coverUrl = book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
    : null;

  return (
    <div className="group relative rounded-xl bg-white border border-stone-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden">
      <Link href={`/book${book.id}`} className="block">
        <div className="relative aspect-[2/3] w-full bg-gradient-to-br from-stone-100 to-stone-50 overflow-hidden">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={book.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-stone-400 gap-2">
              <span className="text-3xl">📖</span>
              <span className="text-xs">No cover</span>
            </div>
          )}
          {favoriteCount !== undefined && favoriteCount > 0 && (
            <div className="absolute top-2 left-2 bg-stone-800 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              {favoriteCount} {favoriteCount === 1 ? "fav" : "favs"}
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm text-stone-900 line-clamp-2 leading-snug">
            {book.title}
          </h3>
          {book.author_name && (
            <p className="text-xs text-stone-500 mt-1 line-clamp-1">
              {book.author_name}
            </p>
          )}
          {book.first_publish_year && (
            <p className="text-xs text-stone-400 mt-0.5">
              {book.first_publish_year}
            </p>
          )}
        </div>
      </Link>
      {showFavoriteButton && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm">
            <FavoriteButton book={book} initialFavorited={isFavorited} />
          </div>
        </div>
      )}
    </div>
  );
}
