import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-client/server";
import { createClient } from "@supabase/supabase-js";

// Service role client — bypass RLS, hanya dipakai di server-side
// JANGAN expose ke client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper: pastikan request dari Super Admin
async function verifySuperAdmin(): Promise<boolean> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.role === "super_admin" && profile?.status === "active";
}

// GET /api/admin/users — ambil semua profiles
export async function GET() {
  if (!(await verifySuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username, nik, email, role, status, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// PATCH /api/admin/users — update role atau status
export async function PATCH(req: NextRequest) {
  if (!(await verifySuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id, role, status } = await req.json();
  if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

  const patch: Record<string, string> = {};
  if (role)   patch.role   = role;
  if (status) patch.status = status;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update(patch)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// POST /api/admin/users — buat user baru (bypass email + langsung active)
export async function POST(req: NextRequest) {
  if (!(await verifySuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { username, nik, email, password, role } = await req.json();
  if (!username || !nik || !email || !password) {
    return NextResponse.json({ error: "username, nik, email, password wajib diisi" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
  }

  // Buat user di Supabase Auth (langsung confirmed, bypass email)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,  // bypass email confirmation
    user_metadata: { username, nik },
  });

  if (authError) {
    return NextResponse.json({
      error: authError.message === "User already registered"
        ? "Email sudah terdaftar."
        : authError.message
    }, { status: 400 });
  }

  // Update profile yang dibuat trigger — set status active + role
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      username,
      nik,
      role: role === "super_admin" ? "super_admin" : "admin",
      status: "active",
    })
    .eq("id", authData.user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: authData.user.id });
}

// DELETE /api/admin/users — hapus user permanent dari auth + profiles
export async function DELETE(req: NextRequest) {
  if (!(await verifySuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

  // Hapus dari auth.users (profiles ikut cascade karena ON DELETE CASCADE)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
