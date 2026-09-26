import { LoginScene } from "@/components/portal/login-scene"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Giriş",
}

export default function LoginPage() {
  const showDemo = process.env.DEMO_LOGIN === "true"
  return <LoginScene showDemo={showDemo} />
}
