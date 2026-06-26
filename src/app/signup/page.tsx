import { Package } from "lucide-react";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Package className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Product Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your account to get started
          </p>
        </div>
      </div>
      <SignupForm />
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Built with Next.js, Firebase & Vercel AI SDK
      </p>
    </div>
  );
}
