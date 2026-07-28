import { getMediaBucket } from "../../lib/commerce-server";
import { requireDatabase } from "../../lib/platform-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const database = await requireDatabase();
    const asset = await database
      .prepare(
        `SELECT r2_key, content_type FROM media_assets
         WHERE id = ? AND status = 'active'`,
      )
      .bind(id.slice(0, 160))
      .first<{ r2_key: string; content_type: string }>();
    const bucket = await getMediaBucket();
    if (!asset || !bucket) return new Response("Not found", { status: 404 });
    const object = await bucket.get(asset.r2_key);
    if (!object?.body) return new Response("Not found", { status: 404 });
    const responseHeaders = new Headers();
    object.writeHttpMetadata?.(responseHeaders);
    responseHeaders.set("content-type", asset.content_type);
    responseHeaders.set(
      "cache-control",
      "public, max-age=31536000, immutable",
    );
    if (object.httpEtag) responseHeaders.set("etag", object.httpEtag);
    return new Response(object.body, { headers: responseHeaders });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
