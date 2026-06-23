'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const TOUR_SECTIONS = [
  {
    id: 'forms',
    title: 'Dynamic Form Builder',
    subtitle: 'Digitize your paperwork',
    description: 'Build custom inspection checklists, site surveys, and completion forms with conditional sections that show or hide based on answers. Start fast with pre-built templates or create your own from scratch.',
    features: [
      'Drag-and-drop form builder',
      'Conditional sections & logic',
      'Pre-built quickstart templates',
      'Photo fields with GPS verification',
      'Digital signature capture',
    ],
    screenshotDesktop: '/screenshots/forms-desktop.png',
    screenshotMobile: '/screenshots/forms-mobile.png',
    iconClass: 'fa-file-signature',
    reversed: false,
    wideScreenshot: true,
  },
  {
    id: 'create-work-order',
    title: 'Work Order Creation',
    subtitle: 'All the details in one place',
    description: 'Create jobs with customer info, location, work type, and technician assignment. Link to properties, attach forms, and set scheduling — all in a clean, simple interface.',
    features: [
      'Customer and location details',
      'Assign technicians',
      'Select work type and forms',
      'Save locations as reusable properties',
    ],
    screenshotDesktop: '/screenshots/create-workorder-desktop.png',
    screenshotMobile: '/screenshots/create-workorder-mobile.png',
    iconClass: 'fa-clipboard-list',
    reversed: true,
  },
  {
    id: 'team',
    title: 'Crew Management',
    subtitle: 'Your team, organized',
    description: 'Invite technicians with one click. Assign roles, track who\'s working on what, and manage your entire team from a single dashboard. No per-user fees — add your whole crew.',
    features: [
      'One-click team invites',
      'Role-based permissions',
      'See team availability',
      'No per-seat pricing',
    ],
    screenshotDesktop: '/screenshots/team-desktop.png',
    screenshotMobile: '/screenshots/team-mobile.png',
    iconClass: 'fa-users',
    reversed: false,
  },
  {
    id: 'technician',
    title: 'Mobile Technician App',
    subtitle: 'Built for the field',
    description: 'A mobile-first app your technicians will actually use. See today\'s jobs, tap to check in with GPS, capture photos, fill out forms, and get directions — all from their phone.',
    features: [
      'Today\'s jobs front and center',
      'One-tap GPS check-in',
      'Photo capture with location proof',
      'Fill forms on-site',
      'Works offline',
    ],
    screenshotDesktop: '',
    screenshotMobile: '/screenshots/tech-mobile.png',
    iconClass: 'fa-mobile-alt',
    reversed: true,
    mobileOnly: true,
  },
  {
    id: 'offline',
    title: 'Offline Mode',
    subtitle: 'Works on rooftops with no signal',
    description: 'Your technicians work on roofs, in basements, in rural areas. Crewatt keeps working even without internet. Forms, photos, check-ins — all saved locally and synced when back online.',
    features: [
      'Full functionality offline',
      'Automatic background sync',
      'No lost data',
      'Works as a native app (PWA)',
    ],
    screenshotDesktop: '',
    screenshotMobile: '',
    iconClass: 'fa-wifi-slash',
    reversed: false,
    noScreenshot: true,
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    subtitle: 'See the big picture',
    description: 'Track job volume, technician activity, and business trends. Visual dashboards show you what\'s working and where to improve — no spreadsheets required.',
    features: [
      'Job completion metrics',
      'Technician performance',
      'Revenue tracking',
      'Visual charts and graphs',
    ],
    screenshotDesktop: '/screenshots/reports-desktop.png',
    screenshotMobile: '/screenshots/reports-mobile.png',
    iconClass: 'fa-chart-bar',
    reversed: true,
  },
  {
    id: 'estimates',
    title: 'Estimates & Proposals',
    subtitle: 'From quote to job in clicks',
    description: 'Create professional estimates with your pricing library. Generate branded PDFs. When the customer says yes, convert to a job with one click.',
    features: [
      'Line-item estimates',
      'Tax and discount support',
      'Branded PDF generation',
      'Convert estimate to job',
    ],
    screenshotDesktop: '/screenshots/estimates-desktop.png',
    screenshotMobile: '/screenshots/estimates-mobile.png',
    iconClass: 'fa-file-invoice-dollar',
    reversed: false,
  },
];

export default function TourPage() {
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/icons/crewatt-logo-primary.svg" alt="Crewatt" className="h-10" />
          </Link>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/features" className="text-muted-foreground hover:text-foreground font-medium text-sm">
              Features
            </Link>
            <Link href="/plans" className="text-muted-foreground hover:text-foreground font-medium text-sm">
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-12 pb-8 sm:pt-16 sm:pb-12 bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-6xl font-black text-foreground mb-4 tracking-tight">
            Product Tour
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
            See how Crewatt helps solar teams manage jobs, capture proof of work, and stay organized.
          </p>
        </div>
      </section>

      {/* Quick nav */}
      <section className="py-6 border-b bg-card/50 sticky top-[73px] z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {TOUR_SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="px-3 py-1.5 text-sm rounded-full border bg-background hover:bg-muted hover:border-primary/50 transition-colors"
              >
                <i className={`fas ${section.iconClass} mr-1.5 text-primary`}></i>
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Tour sections */}
      <div className="py-12 sm:py-16">
        {TOUR_SECTIONS.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className={`py-12 sm:py-20 ${index % 2 === 1 ? 'bg-muted/30' : ''}`}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              {section.wideScreenshot ? (
                /* Wide screenshot layout - content on top, full-width screenshot below */
                <div className="space-y-8">
                  {/* Content */}
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <i className={`fas ${section.iconClass} text-lg text-primary`}></i>
                      </div>
                      <span className="text-sm font-medium text-primary">{section.subtitle}</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                      {section.title}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      {section.description}
                    </p>
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {section.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <i className="fas fa-check text-green-500 mt-1"></i>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Wide desktop screenshot */}
                  <div
                    className="bg-card border rounded-xl shadow-2xl overflow-hidden cursor-zoom-in hover:shadow-3xl transition-shadow"
                    onClick={() => setLightboxImage({ src: section.screenshotDesktop, alt: `${section.title} desktop view` })}
                  >
                    <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-xs text-muted-foreground">app.crewatt.com</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <i className="fas fa-expand"></i>
                      </div>
                    </div>
                    <div className="bg-muted/20 flex items-center justify-center relative">
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                        <i className={`fas ${section.iconClass} text-4xl mb-2 opacity-30`}></i>
                        <span className="text-sm">Desktop screenshot</span>
                      </div>
                      <img
                        src={section.screenshotDesktop}
                        alt={`${section.title} desktop view`}
                        className="w-full h-auto relative z-10"
                      />
                    </div>
                  </div>
                </div>
              ) : section.mobileOnly ? (
                /* Mobile-only layout - shows larger phone mockup */
                <div className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${section.reversed ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Content */}
                  <div className={section.reversed ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <i className={`fas ${section.iconClass} text-lg text-primary`}></i>
                      </div>
                      <span className="text-sm font-medium text-primary">{section.subtitle}</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                      {section.title}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      {section.description}
                    </p>
                    <ul className="space-y-3">
                      {section.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <i className="fas fa-check text-green-500 mt-1"></i>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mobile screenshot - larger standalone */}
                  <div className={`flex justify-center ${section.reversed ? 'lg:order-1' : ''}`}>
                    <div
                      className="w-64 sm:w-72 bg-card border-4 border-foreground/10 rounded-[2.5rem] shadow-2xl overflow-hidden cursor-zoom-in hover:scale-105 transition-transform"
                      onClick={() => setLightboxImage({ src: section.screenshotMobile, alt: `${section.title} mobile view` })}
                    >
                      {/* Phone notch */}
                      <div className="bg-foreground/10 py-2 flex justify-center">
                        <div className="w-20 h-1.5 bg-foreground/20 rounded-full"></div>
                      </div>
                      <div className="aspect-[9/16] bg-muted/20 flex items-center justify-center relative">
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-2">
                          <i className="fas fa-mobile-alt text-3xl opacity-30"></i>
                        </div>
                        <img
                          src={section.screenshotMobile}
                          alt={`${section.title} mobile view`}
                          className="w-full h-full object-cover object-top relative z-10"
                        />
                      </div>
                      {/* Phone home bar */}
                      <div className="bg-foreground/10 py-2 flex justify-center">
                        <div className="w-24 h-1 bg-foreground/30 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : section.noScreenshot ? (
                /* No screenshot layout - illustration only */
                <div className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${section.reversed ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Content */}
                  <div className={section.reversed ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <i className={`fas ${section.iconClass} text-lg text-primary`}></i>
                      </div>
                      <span className="text-sm font-medium text-primary">{section.subtitle}</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                      {section.title}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      {section.description}
                    </p>
                    <ul className="space-y-3">
                      {section.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <i className="fas fa-check text-green-500 mt-1"></i>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Illustration */}
                  <div className={`${section.reversed ? 'lg:order-1' : ''}`}>
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 sm:p-12">
                      <div className="flex flex-col items-center text-center">
                        {/* Animated offline icon illustration */}
                        <div className="relative mb-6">
                          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                            <i className="fas fa-wifi-slash text-4xl text-primary"></i>
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <i className="fas fa-check text-white text-sm"></i>
                          </div>
                        </div>
                        <div className="space-y-4 max-w-xs">
                          <div className="flex items-center gap-3 bg-card rounded-lg p-3 shadow-sm">
                            <i className="fas fa-camera text-primary"></i>
                            <span className="text-sm">Photos saved locally</span>
                            <i className="fas fa-check-circle text-green-500 ml-auto"></i>
                          </div>
                          <div className="flex items-center gap-3 bg-card rounded-lg p-3 shadow-sm">
                            <i className="fas fa-clipboard-check text-primary"></i>
                            <span className="text-sm">Forms completed offline</span>
                            <i className="fas fa-check-circle text-green-500 ml-auto"></i>
                          </div>
                          <div className="flex items-center gap-3 bg-card rounded-lg p-3 shadow-sm">
                            <i className="fas fa-sync text-primary"></i>
                            <span className="text-sm">Auto-sync when online</span>
                            <i className="fas fa-check-circle text-green-500 ml-auto"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard side-by-side layout */
                <div className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${section.reversed ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Content */}
                  <div className={section.reversed ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <i className={`fas ${section.iconClass} text-lg text-primary`}></i>
                      </div>
                      <span className="text-sm font-medium text-primary">{section.subtitle}</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                      {section.title}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      {section.description}
                    </p>
                    <ul className="space-y-3">
                      {section.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <i className="fas fa-check text-green-500 mt-1"></i>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Screenshots */}
                  <div className={`relative ${section.reversed ? 'lg:order-1' : ''}`}>
                    {/* Desktop screenshot */}
                    <div
                      className="bg-card border rounded-xl shadow-2xl overflow-hidden cursor-zoom-in hover:shadow-3xl transition-shadow"
                      onClick={() => setLightboxImage({ src: section.screenshotDesktop, alt: `${section.title} desktop view` })}
                    >
                      <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="flex-1 text-center">
                          <span className="text-xs text-muted-foreground">app.crewatt.com</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <i className="fas fa-expand"></i>
                        </div>
                      </div>
                      <div className="aspect-[16/10] bg-muted/20 flex items-center justify-center relative">
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                          <i className={`fas ${section.iconClass} text-4xl mb-2 opacity-30`}></i>
                          <span className="text-sm">Desktop screenshot</span>
                        </div>
                        <img
                          src={section.screenshotDesktop}
                          alt={`${section.title} desktop view`}
                          className="w-full h-full object-cover object-top relative z-10"
                        />
                      </div>
                    </div>

                    {/* Mobile screenshot - overlaid */}
                    <div
                      className="absolute -bottom-4 -right-4 sm:bottom-4 sm:right-4 w-24 sm:w-32 bg-card border-4 border-background rounded-2xl shadow-2xl overflow-hidden cursor-zoom-in hover:scale-105 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImage({ src: section.screenshotMobile, alt: `${section.title} mobile view` });
                      }}
                    >
                      <div className="bg-muted/50 py-1 flex justify-center">
                        <div className="w-12 h-1 bg-muted rounded-full"></div>
                      </div>
                      <div className="aspect-[9/16] bg-muted/20 flex items-center justify-center relative">
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-2">
                          <i className="fas fa-mobile-alt text-xl opacity-30"></i>
                        </div>
                        <img
                          src={section.screenshotMobile}
                          alt={`${section.title} mobile view`}
                          className="w-full h-full object-cover object-top relative z-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to try it yourself?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Start your free 14-day trial. No credit card required. See how Crewatt can transform your solar operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Free Trial
                <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            </Link>
            <Link href="/plans">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Crewatt. All rights reserved.</p>
        </div>
      </footer>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setLightboxImage(null)}
          >
            <i className="fas fa-times text-2xl"></i>
          </button>
          <img
            src={lightboxImage.src}
            alt={lightboxImage.alt}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            Click anywhere to close
          </p>
        </div>
      )}
    </div>
  );
}
