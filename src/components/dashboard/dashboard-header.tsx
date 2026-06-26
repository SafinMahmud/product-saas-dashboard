"use client";

import { LogOut, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function DashboardHeader() {
  const { user, signOut, isAdmin } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="size-4" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">
            Product Dashboard
          </h1>
          <Badge
            variant={isAdmin ? "default" : "secondary"}
            className="hidden sm:inline-flex"
          >
            {isAdmin ? "Admin" : "Viewer"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="max-w-[200px] truncate text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Badge
              variant={isAdmin ? "default" : "secondary"}
              className="sm:hidden"
            >
              {isAdmin ? "Admin" : "Viewer"}
            </Badge>
          </div>
          <Separator
            orientation="vertical"
            className="hidden h-6 sm:block"
          />
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
