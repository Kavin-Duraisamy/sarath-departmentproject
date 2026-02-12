import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Department Portal</h1>
          <p className="text-muted-foreground text-sm">Placement & Academic Intelligence System</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
