"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/lib/actions";
import type { Book } from "@/lib/types";

export function PendingFavorites() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const flushed = useRef(false);
  const prevSignedIn = useRef(isSignedIn);

  useEffect(() => {
    // Detect sign-in transition and always refresh
    if (isSignedIn && !prevSignedIn.current) {
      const pending: Book[] = JSON.parse(
        localStorage.getItem("pendingFavorites") || "[]"
      );

      if (pending.length > 0 && !flushed.current) {
        flushed.current = true;
        localStorage.removeItem("pendingFavorites");
        Promise.all(pending.map((book) => toggleFavorite(book)))
          .then(() => router.refresh())
          .catch(() => {
            localStorage.setItem("pendingFavorites", JSON.stringify(pending));
            flushed.current = false;
          });
      } else {
        router.refresh();
      }
    }
    prevSignedIn.current = isSignedIn;
  }, [isSignedIn, router]);

  return null;
}
