import { getMediaBucket, createRecordId } from "../../lib/commerce-server";
import {
  assertSameOrigin,
  enforceRateLimit,
  errorResponse,
  recordAudit,
  requireDatabase,
  requireRole,
} from "../../lib/platform-server";

const ALLOWED_MEDIA = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function GET() {
  try {
    const actor = await requireRole(["seller", "admin"]);
    const database = await requireDatabase();
    const statement =
      actor.role === "admin"
        ? database.prepare(
            `SELECT id, owner_user_id, seller_id, filename, content_type,
             byte_size, alt_text, created_at FROM media_assets
             WHERE status = 'active' ORDER BY created_at DESC LIMIT 200`,
          )
        : database
            .prepare(
              `SELECT id, owner_user_id, seller_id, filename, content_type,
               byte_size, alt_text, created_at FROM media_assets
               WHERE status = 'active' AND owner_user_id = ?
               ORDER BY created_at DESC LIMIT 200`,
            )
            .bind(actor.id);
    const rows = await statement.all();
    return Response.json({
      configured: Boolean(await getMediaBucket()),
      assets: (rows.results ?? []).map((asset) => ({
        ...asset,
        url: `/media/${asset.id}`,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireRole(["seller", "admin"]);
    const database = await requireDatabase();
    await enforceRateLimit(database, "media-upload", 30, 60 * 60);
    const bucket = await getMediaBucket();
    if (!bucket) {
      return Response.json(
        { message: "R2 chưa được gắn với môi trường triển khai." },
        { status: 503 },
      );
    }
    const form = await request.formData();
    const file = form.get("file");
    const altText = String(form.get("altText") ?? "").trim().slice(0, 200);
    if (!(file instanceof File)) {
      return Response.json(
        { message: "Vui lòng chọn một tệp ảnh." },
        { status: 400 },
      );
    }
    if (!ALLOWED_MEDIA.has(file.type) || file.size > MAX_UPLOAD_BYTES) {
      return Response.json(
        {
          message:
            "Chỉ nhận JPG, PNG, WebP hoặc AVIF với dung lượng tối đa 5 MB.",
        },
        { status: 400 },
      );
    }
    const extension =
      file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
      "bin";
    const id = createRecordId("media");
    const r2Key = `${actor.sellerId ?? actor.id}/${new Date()
      .toISOString()
      .slice(0, 7)}/${id}.${extension}`;
    await bucket.put(r2Key, file, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        ownerUserId: actor.id,
        originalFilename: file.name.slice(0, 180),
      },
    });
    try {
      await database
        .prepare(
          `INSERT INTO media_assets
           (id, owner_user_id, seller_id, r2_key, filename, content_type,
            byte_size, alt_text, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
        )
        .bind(
          id,
          actor.id,
          actor.sellerId,
          r2Key,
          file.name.slice(0, 180),
          file.type,
          file.size,
          altText || null,
          new Date().toISOString(),
        )
        .run();
    } catch (error) {
      await bucket.delete(r2Key);
      throw error;
    }
    await recordAudit(database, {
      actorUserId: actor.id,
      action: "media.uploaded",
      resourceType: "media",
      resourceId: id,
      payload: { contentType: file.type, byteSize: file.size },
    });
    return Response.json(
      { ok: true, asset: { id, url: `/media/${id}` } },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
