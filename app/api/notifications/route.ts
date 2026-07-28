import {
  assertSameOrigin,
  errorResponse,
  requireAppUser,
  requireDatabase,
} from "../../lib/platform-server";

export async function GET() {
  try {
    const user = await requireAppUser();
    const database = await requireDatabase();
    const rows = await database
      .prepare(
        `SELECT id, type, title, message, action_url, read_at, created_at
         FROM notifications WHERE user_id = ?
         ORDER BY created_at DESC LIMIT 100`,
      )
      .bind(user.id)
      .all();
    return Response.json({ notifications: rows.results ?? [] });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireAppUser();
    const database = await requireDatabase();
    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      all?: boolean;
    };
    const now = new Date().toISOString();
    if (body.all) {
      await database
        .prepare(
          `UPDATE notifications SET read_at = ?
           WHERE user_id = ? AND read_at IS NULL`,
        )
        .bind(now, user.id)
        .run();
    } else if (body.id) {
      await database
        .prepare(
          `UPDATE notifications SET read_at = ?
           WHERE id = ? AND user_id = ?`,
        )
        .bind(now, body.id.slice(0, 160), user.id)
        .run();
    } else {
      return Response.json(
        { message: "Thiếu thông báo cần cập nhật." },
        { status: 400 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
