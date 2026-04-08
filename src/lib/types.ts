export interface Book {
  id: string;
  title: string;
  author_name: string | null;
  cover_i: number | null;
  first_publish_year: number | null;
}

export interface BookWithFavoriteCount extends Book {
  favorite_count: number;
}

export interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
}
