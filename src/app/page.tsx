import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { PortalContainer } from "@/components/dashboard/PortalContainer";

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return <PortalContainer initialUser={user} />;
}
