'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "@/app/auth/actions";
import type { User } from "@supabase/supabase-js";

const NAV_ITEMS = [
  { href: "/schedule", label: "Jobs", icon: "fa-calendar-alt" },
  { href: "/properties", label: "Properties", icon: "fa-building" },
  { href: "/estimates", label: "Estimates", icon: "fa-file-invoice-dollar" },
  { href: "/team", label: "Team", icon: "fa-users" },
  { href: "/pricing", label: "Pricing", icon: "fa-tag" },
  { href: "/forms", label: "Forms", icon: "fa-file-alt" },
  { href: "/settings", label: "Settings", icon: "fa-cog" },
];

interface AppHeaderProps {
  user: User;
  userProfile?: {
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
  };
}

export function AppHeader({ user, userProfile }: AppHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/schedule" ? pathname === "/schedule" : pathname?.startsWith(href);

  const firstName = userProfile?.firstName || user.email?.split('@')[0] || 'User';
  const lastName = userProfile?.lastName || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U';

  const UserAvatar = () =>
    userProfile?.profileImageUrl ? (
      <img
        src={userProfile.profileImageUrl}
        alt={`${firstName} ${lastName}`}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    ) : (
      <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
        {initials}
      </div>
    );

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/schedule">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-clipboard-list text-primary-foreground text-xl"></i>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-foreground">FieldCapture</h1>
                <p className="text-xs text-muted-foreground">Service Work Logger</p>
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <i className={`fas ${item.icon}`}></i>
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* New Job button - always visible */}
            <Link href="/schedule?new=true" className="hidden sm:block">
              <Button size="sm" className="gap-2">
                <i className="fas fa-plus"></i>
                New Job
              </Button>
            </Link>

            {/* Desktop logout + user */}
            <div className="hidden lg:flex items-center gap-3">
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  Logout
                </Button>
              </form>
              <UserAvatar />
            </div>

            {/* Mobile: avatar + hamburger */}
            <div className="flex lg:hidden items-center gap-2">
              <UserAvatar />
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                  >
                    <i className="fas fa-bars text-lg"></i>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 p-0 flex flex-col">
                  {/* User info */}
                  <div className="p-5 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <UserAvatar />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {firstName} {lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* New Job button - mobile */}
                  <div className="px-4 pt-4">
                    <Link href="/schedule?new=true" onClick={() => setOpen(false)}>
                      <Button className="w-full gap-2">
                        <i className="fas fa-plus"></i>
                        New Job
                      </Button>
                    </Link>
                  </div>

                  {/* Nav links */}
                  <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                        <button
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                            isActive(item.href)
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <i className={`fas ${item.icon} w-4 text-center`}></i>
                          {item.label}
                        </button>
                      </Link>
                    ))}
                  </nav>

                  {/* Sign out */}
                  <div className="p-4 border-t border-border">
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <i className="fas fa-sign-out-alt w-4 text-center"></i>
                        Sign Out
                      </button>
                    </form>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
