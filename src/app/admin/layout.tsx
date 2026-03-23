import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/admin/admin-nav";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "mevans6453@gmail.com";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in → redirect to homepage
  if (!user) {
    redirect("/");
  }

  // Wrong email → redirect to homepage
  if (user.email !== ADMIN_EMAIL) {
    redirect("/");
  }

  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
