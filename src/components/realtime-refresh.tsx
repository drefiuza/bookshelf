"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export function RealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel("favorites-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "favorites" },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
