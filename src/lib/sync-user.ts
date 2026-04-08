import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function syncUser() {
  const { userId } = await auth();
  if (!userId) return;

  const user = await currentUser();
  if (!user) return;

  await supabase.from("users").upsert({
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    first_name: user.firstName,
    last_name: user.lastName,
    image_url: user.imageUrl,
    updated_at: new Date().toISOString(),
  });
}
