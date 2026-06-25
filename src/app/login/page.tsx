import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Product SaaS Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Mini product management platform
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
