import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const offset = request.nextUrl.searchParams.get("offset") || "0";
  const limit = request.nextUrl.searchParams.get("limit") || "20";

  if (!query) return Response.json({ docs: [], numFound: 0 });

  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
  );
  const data = await res.json();
  return Response.json({ docs: data.docs, numFound: data.numFound });
}
