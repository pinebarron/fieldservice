import Link from 'next/link';
import Image from 'next/image';
import { isIndustryEnabled } from '@/lib/industries';
import { redirect } from 'next/navigation';

export default function PressureWashingLandingPage() {
  // Redirect to home if industry not enabled
  if (!isIndustryEnabled('pressure-washing')) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800">
        {/* Placeholder gradient until you add an image */}
        <div className="absolute inset-0 bg-[url('/pressure-washing-hero.png')] bg-cover bg-center opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-background" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-2 mb-6">
              <i className="fas fa-spray-can text-blue-300"></i>
              <span className="text-white/90 text-sm font-medium">Built for Pressure Washing Pros</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
              Crewatt
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
              Before & after photos, job tracking, and estimates for pressure washing businesses
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="rounded-md bg-blue-500 px-6 py-3 font-medium text-white hover:bg-blue-600 shadow-lg"
              >
                Sign In
              </Link>
              <Link
                href="/signup?industry=pressure-washing"
                className="rounded-md bg-white/90 backdrop-blur px-6 py-3 font-medium text-gray-900 hover:bg-white shadow-lg"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Pain Points */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Stop Losing Jobs to Poor Documentation</h2>
          <p className="text-lg text-muted-foreground">
            Your before & after photos are your best marketing. Crewatt organizes them automatically with GPS verification.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card rounded-lg border p-6">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
              <i className="fas fa-camera text-blue-500 text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">Before & After Photos</h3>
            <p className="text-muted-foreground text-sm">
              Automatically organized and tagged. GPS-stamped to prove you were on site. Perfect for disputes and marketing.
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
              <i className="fas fa-file-invoice-dollar text-blue-500 text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">Quick Estimates</h3>
            <p className="text-muted-foreground text-sm">
              Create professional estimates on-site. Price by square foot for driveways, house wash, decks, and more.
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
              <i className="fas fa-calendar-check text-blue-500 text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">Job Scheduling</h3>
            <p className="text-muted-foreground text-sm">
              Calendar view of all jobs. Assign to crew members. Track check-in/check-out times automatically.
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
              <i className="fas fa-clipboard-list text-blue-500 text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">Job Checklists</h3>
            <p className="text-muted-foreground text-sm">
              Custom forms for house wash, roof cleaning, concrete - ensure nothing gets missed.
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
              <i className="fas fa-users text-blue-500 text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">Crew Management</h3>
            <p className="text-muted-foreground text-sm">
              Add technicians, assign jobs, track who did what. Perfect for growing your team.
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
              <i className="fas fa-map-marker-alt text-blue-500 text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">GPS Verification</h3>
            <p className="text-muted-foreground text-sm">
              Prove you were there. GPS-tagged photos and check-in times protect you from disputes.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-2xl mx-auto text-center mt-16 p-8 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
          <h3 className="text-2xl font-bold mb-3">Ready to streamline your business?</h3>
          <p className="text-muted-foreground mb-6">
            Join pressure washing pros who save hours every week on documentation.
          </p>
          <Link
            href="/signup?industry=pressure-washing"
            className="inline-block rounded-md bg-blue-500 px-8 py-3 font-medium text-white hover:bg-blue-600"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}
