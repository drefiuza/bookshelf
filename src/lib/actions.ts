"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "./supabase-server";
import type { Book } from "./types";

async function fetchCoverFromWorks(workKey: string): Promise<number | null> {
  try {
    const res = await fetch(`https://openlibrary.org${workKey}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    const covers: number[] | undefined = data.covers;
    return covers?.find((c) => c > 0) ?? null;
  } catch {
    return null;
  }
}

export async function toggleFavorite(book: Book) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  // If no cover, try to fetch from Works API
  let coverId = book.cover_i;
  if (!coverId) {
    coverId = await fetchCoverFromWorks(book.id);
  }

  // Upsert book metadata into cache
  await supabaseAdmin.from("books").upsert({
    id: book.id,
    title: book.title,
    author_name: book.author_name,
    cover_i: coverId,
    first_publish_year: book.first_publish_year,
  });

  // Check if already favorited
  const { data: existing } = await supabaseAdmin
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", book.id)
    .single();

  if (existing) {
    await supabaseAdmin.from("favorites").delete().eq("id", existing.id);
    revalidatePath("/");
    return { favorited: false };
  } else {
    await supabaseAdmin.from("favorites").insert({
      user_id: userId,
      book_id: book.id,
    });
    revalidatePath("/");
    return { favorited: true };
  }
}
