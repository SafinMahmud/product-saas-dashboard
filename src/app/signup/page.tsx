import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Product SaaS Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Create your account to get started
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
