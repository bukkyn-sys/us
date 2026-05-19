import * as functions from "firebase-functions";
import * as https from "https";
import * as http from "http";

/**
 * Server-side OG image fetcher.
 * Called by the client with ?url=<encoded-url>
 * Returns { title, image, description } or an error.
 */
export const fetchOgData = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const rawUrl = req.query.url as string;
  if (!rawUrl) {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  const lib = targetUrl.protocol === "https:" ? https : http;

  const request = lib.get(
    targetUrl.toString(),
    { headers: { "User-Agent": "Mozilla/5.0 (compatible; us-app/1.0)" } },
    (response) => {
      // Follow redirects (up to 5)
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        res.status(200).json({ error: "redirect" });
        return;
      }

      let html = "";
      response.setEncoding("utf8");
      response.on("data", (chunk: string) => {
        html += chunk;
        if (html.length > 150000) response.destroy();
      });
      response.on("end", () => {
        const title = extractMeta(html, "og:title") || extractTitle(html);
        const image = extractMeta(html, "og:image");
        const description = extractMeta(html, "og:description");
        res.status(200).json({ title, image, description });
      });
    }
  );

  request.on("error", () => {
    res.status(500).json({ error: "Failed to fetch URL" });
  });

  request.setTimeout(8000, () => {
    request.destroy();
    res.status(504).json({ error: "Timeout" });
  });
});

function extractMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const m = html.match(re);
  if (m) return m[1];

  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i"
  );
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}
