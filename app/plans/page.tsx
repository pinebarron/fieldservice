import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/icons/crewatt-logo-primary.svg" alt="Crewatt" className="h-10" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/features" className="text-muted-foreground hover:text-foreground font-medium text-sm">
              Features
            </Link>
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Beta Banner */}
      <section className="bg-primary text-primary-foreground py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg sm:text-xl font-semibold">
            New Beta Customers Get 3 Months Free
          </p>
          <p className="text-sm opacity-90 mt-1">
            <span className="inline-flex items-center gap-1">
              <i className="fas fa-fire text-yellow-300"></i>
              3 Spots Left
            </span>
          </p>
        </div>
      </section>

      {/* Hero */}
      <section className="pt-12 pb-8 sm:pt-16 sm:pb-12 bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl sm:text-8xl font-black text-foreground mb-4 tracking-tight">
            Pricing
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Simple, transparent pricing for solar service teams.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="py-12 sm:py-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          {/* Starter - Full Featured */}
          <div className="bg-card border-2 border-primary rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
              Beta Pricing
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2 text-center">Starter</h3>
            <div className="mb-6 text-center">
              <span className="text-5xl font-bold">$49</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-center text-muted-foreground mb-6">
              Everything you need to manage your solar service team
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500 w-5"></i>
                Up to 5 team members
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500 w-5"></i>
                Unlimited work orders
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500 w-5"></i>
                Custom form templates
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500 w-5"></i>
                Conditional field visibility
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500 w-5"></i>
                Photo uploads with GPS tagging
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500 w-5"></i>
                Estimates & PDF generation
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500 w-5"></i>
                Customer scorecards
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500 w-5"></i>
                Reporting dashboard
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500 w-5"></i>
                Mobile-first technician app
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check text-green-500 w-5"></i>
                Offline support
              </li>
            </ul>
            <Link href="/signup">
              <Button className="w-full" size="lg">
                Start Free Trial
              </Button>
            </Link>
            <p className="text-xs text-center text-muted-foreground mt-3">
              No credit card required
            </p>
          </div>
          {/* FAQ teaser */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Have questions? <a href="mailto:hello@crewatt.com" className="text-primary hover:underline">Contact us</a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Crewatt. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
