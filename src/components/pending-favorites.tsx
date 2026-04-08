"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { toggleFavorite } from "@/lib/actions";
import type { Book } from "@/lib/types";

export function PendingFavorites() {
  const { isSignedIn } = useAuth();
  const flushed = useRef(false);

  useEffect(() => {
    if (!isSignedIn || flushed.current) return;

    const pending: Book[] = JSON.parse(
      localStorage.getItem("pendingFavorites") || "[]"
    );
    if (pending.length === 0) return;

    flushed.current = true;
    localStorage.removeItem("pendingFavorites");

    // Favorite each pending book
    Promise.all(pending.map((book) => toggleFavorite(book))).catch(() => {
      // If it fails, restore them so the user can retry
      localStorage.setItem("pendingFavorites", JSON.stringify(pending));
      flushed.current = false;
    });
  }, [isSignedIn]);

  return null;
}
