import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "fa-home" },
  { href: "/schedule", label: "Schedule", icon: "fa-calendar-alt" },
  { href: "/properties", label: "Properties", icon: "fa-building" },
  { href: "/estimates", label: "Estimates", icon: "fa-file-invoice-dollar" },
  { href: "/team", label: "Team", icon: "fa-users" },
  { href: "/vendors", label: "Vendors", icon: "fa-handshake" },
  { href: "/pricing", label: "Pricing", icon: "fa-tag" },
  { href: "/forms", label: "Forms", icon: "fa-file-alt" },
  { href: "/settings", label: "Settings", icon: "fa-cog" },
];

export function AppHeader() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const UserAvatar = () =>
    user?.profileImageUrl ? (
      <img
        src={user.profileImageUrl}
        alt={`${user.firstName} ${user.lastName}`}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    ) : (
      <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
        {user?.firstName?.[0]}
        {user?.lastName?.[0]}
      </div>
    );

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <img
                src="/icons/crewatt-icon.svg"
                alt="Crewatt"
                className="w-10 h-10 sm:hidden"
              />
              <img
                src="/icons/crewatt-logo-primary.svg"
                alt="Crewatt"
                className="h-10 hidden sm:block"
              />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <i className={`fas ${item.icon}`}></i>
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Desktop logout + user */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => (window.location.href = "/api/logout")}
                data-testid="logout-button"
              >
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </Button>
              <UserAvatar />
              <span className="text-sm font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </span>
            </div>

            {/* Mobile: avatar + hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <UserAvatar />
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    data-testid="mobile-menu-button"
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
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Nav links */}
                  <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <button
                          onClick={() => setOpen(false)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                            isActive(item.href)
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-muted"
                          }`}
                          data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                        >
                          <i className={`fas ${item.icon} w-4 text-center`}></i>
                          {item.label}
                        </button>
                      </Link>
                    ))}
                  </nav>

                  {/* Sign out */}
                  <div className="p-4 border-t border-border">
                    <button
                      onClick={() => (window.location.href = "/api/logout")}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      data-testid="mobile-logout-button"
                    >
                      <i className="fas fa-sign-out-alt w-4 text-center"></i>
                      Sign Out
                    </button>
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
