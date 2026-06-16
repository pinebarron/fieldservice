import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section with Image */}
      <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        <Image
          src="/solar_home.png"
          alt="Solar field service"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <img
              src="/icons/crewatt-logo-dark.svg"
              alt="Crewatt"
              className="h-16 md:h-20 mx-auto mb-6 drop-shadow-lg"
            />
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
              Professional work log management for solar field service teams
            </p>
            <div className="flex gap-4 justify-center mb-6">
              <Link
                href="/login"
                className="rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 shadow-lg"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-white/90 backdrop-blur px-6 py-3 font-medium text-gray-900 hover:bg-white shadow-lg"
              >
                Create Account
              </Link>
            </div>
            <div className="flex gap-6 justify-center">
              <Link
                href="/features"
                className="text-white/80 hover:text-white font-medium transition-colors"
              >
                Features
              </Link>
              <Link
                href="/plans"
                className="text-white/80 hover:text-white font-medium transition-colors"
              >
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
          <div className="bg-card rounded-lg border p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Track Work Logs</h3>
            <p className="text-muted-foreground text-sm">
              Record detailed work performed, customer information, and service details in one place
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Manage Your Crew</h3>
            <p className="text-muted-foreground text-sm">
              Add employees to your business and track which technician worked on each job
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Photos & Reports</h3>
            <p className="text-muted-foreground text-sm">
              Attach images and PDF reports to document your work with cloud storage
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
