import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()
  if (!session?.user) redirect("/giris")
  redirect(session.user.role === "INTERN" ? "/gorevler" : "/is-listesi")
}
