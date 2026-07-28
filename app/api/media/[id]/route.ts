import { getMediaBucket } from "../../../lib/commerce-server";
import {
  assertSameOrigin,
  errorResponse,
  recordAudit,
  requireDatabase,
  requireRole,
} from "../../../lib/platform-server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireRole(["seller", "admin"]);
    const database = await requireDatabase();
    const { id } = await params;
    const asset = await database
      .prepare(
        `SELECT owner_user_id, r2_key FROM media_assets
         WHERE id = ? AND status = 'active'`,
      )
      .bind(id.slice(0, 160))
      .first<{ owner_user_id: string; r2_key: string }>();
    if (!asset) {
      return Response.json(
        { message: "Không tìm thấy ảnh." },
        { status: 404 },
      );
    }
    if (actor.role !== "admin" && asset.owner_user_id !== actor.id) {
      return Response.json(
        { message: "Bạn không có quyền xóa ảnh này." },
        { status: 403 },
      );
    }
    const bucket = await getMediaBucket();
    if (!bucket) {
      return Response.json(
        { message: "R2 chưa được cấu hình." },
        { status: 503 },
      );
    }
    await bucket.delete(asset.r2_key);
    await database
      .prepare(`UPDATE media_assets SET status = 'deleted' WHERE id = ?`)
      .bind(id)
      .run();
    await recordAudit(database, {
      actorUserId: actor.id,
      action: "media.deleted",
      resourceType: "media",
      resourceId: id,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
