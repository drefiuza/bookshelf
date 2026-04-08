import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const offset = request.nextUrl.searchParams.get("offset") || "0";
  const limit = request.nextUrl.searchParams.get("limit") || "20";

  const res = await fetch(
    `https://openlibrary.org/search.json?q=subject:fiction&sort=rating&limit=${limit}&offset=${offset}`
  );
  const data = await res.json();
  return Response.json({ docs: data.docs, numFound: data.numFound });
}
