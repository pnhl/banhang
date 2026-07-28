import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  getAdminPassword,
  verifyAdminPassword,
} from "../../../lib/admin-auth";
import {
  assertSameOrigin,
  errorResponse,
} from "../../../lib/platform-server";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    return errorResponse(error);
  }
  if (!(await getAdminPassword())) {
    return NextResponse.json(
      { message: "Mật khẩu quản trị chưa được cấu hình trên máy chủ." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    password?: string;
  };

  if (!(await verifyAdminPassword(body.password ?? ""))) {
    return NextResponse.json(
      { message: "Mật khẩu quản trị không chính xác." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: new URL(request.url).protocol === "https:",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return response;
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    return errorResponse(error);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: new URL(request.url).protocol === "https:",
    maxAge: 0,
    path: "/",
  });
  return response;
}
