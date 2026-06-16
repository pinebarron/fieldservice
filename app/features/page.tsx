import Link from 'next/link';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    category: 'Work Order Management',
    categoryIcon: 'fa-clipboard-check',
    features: [
      {
        name: 'Work Order Creation',
        description: 'Create and manage work orders with customer details, location, scheduling, and technician assignment.',
        icon: 'fa-clipboard-list',
      },
      {
        name: 'Scheduling Calendar',
        description: 'Visual calendar view to see all scheduled work orders at a glance. Drag and drop scheduling.',
        icon: 'fa-calendar-alt',
      },
      {
        name: 'Customer Confirmation',
        description: 'Track whether customers have confirmed their appointments before technicians are dispatched.',
        icon: 'fa-check-circle',
      },
      {
        name: 'Customer Scorecards',
        description: 'Send feedback surveys to customers after job completion. Collect ratings on quality, professionalism, value, and timeliness.',
        icon: 'fa-star',
      },
    ],
  },
  {
    category: 'Forms & Templates',
    categoryIcon: 'fa-file-alt',
    features: [
      {
        name: 'Custom Form Templates',
        description: 'Build custom forms for site surveys, inspections, installation checklists, and more. Drag and drop form builder.',
        icon: 'fa-file-alt',
      },
      {
        name: 'Conditional Field Visibility',
        description: 'Show or hide form fields based on previous answers. Create dynamic, intelligent forms.',
        icon: 'fa-code-branch',
      },
      {
        name: 'Digital Signatures',
        description: 'Capture customer signatures directly on forms for approvals and sign-offs.',
        icon: 'fa-signature',
      },
    ],
  },
  {
    category: 'Mobile & Field',
    categoryIcon: 'fa-mobile-alt',
    features: [
      {
        name: 'Mobile-First Technician Experience',
        description: 'Simplified mobile interface designed for field technicians. Check in/out, complete forms, capture photos.',
        icon: 'fa-mobile-alt',
      },
      {
        name: 'Mobile Image Upload',
        description: 'Capture before/after photos directly from the field. Supports multiple photos per field.',
        icon: 'fa-camera',
      },
      {
        name: 'Image Geo-Coding',
        description: 'Automatically tag photos with GPS coordinates to verify work location and create audit trails.',
        icon: 'fa-map-marker-alt',
      },
      {
        name: 'Offline Support',
        description: 'Continue working without internet. Forms and data sync automatically when back online.',
        icon: 'fa-wifi-slash',
      },
      {
        name: 'PWA / Home Screen App',
        description: 'Install as a native-like app on iOS and Android directly from the browser.',
        icon: 'fa-th-large',
      },
    ],
  },
  {
    category: 'Estimates & Pricing',
    categoryIcon: 'fa-calculator',
    features: [
      {
        name: 'Estimate Creation',
        description: 'Build professional estimates with line items, quantities, and pricing. Solar-specific pricing units.',
        icon: 'fa-file-invoice-dollar',
      },
      {
        name: 'PDF Estimate Generation',
        description: 'Generate branded PDF estimates to send to customers. Professional formatting with your logo.',
        icon: 'fa-file-pdf',
      },
      {
        name: 'Pricing Library',
        description: 'Maintain a library of standard pricing items for quick estimate creation.',
        icon: 'fa-tags',
      },
    ],
  },
  {
    category: 'Properties & Customers',
    categoryIcon: 'fa-building',
    features: [
      {
        name: 'Property Management',
        description: 'Store customer properties with addresses, contacts, and property details for quick work order creation.',
        icon: 'fa-building',
      },
      {
        name: 'Residential & Commercial',
        description: 'Categorize properties as residential or commercial for reporting and workflow customization.',
        icon: 'fa-home',
      },
    ],
  },
  {
    category: 'Team & Reporting',
    categoryIcon: 'fa-chart-line',
    features: [
      {
        name: 'Team Management',
        description: 'Invite team members, assign roles (admin, technician), and manage permissions.',
        icon: 'fa-users',
      },
      {
        name: 'Reporting Dashboard',
        description: 'Track work order status, technician productivity, form completion rates, and geographic distribution.',
        icon: 'fa-chart-bar',
      },
      {
        name: 'Estimate-to-Job Conversion',
        description: 'Track your sales pipeline from estimate to accepted to completed work order.',
        icon: 'fa-funnel-dollar',
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/icons/crewatt-logo-primary.svg" alt="Crewatt" className="h-10" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-8 sm:pt-20 sm:pb-12 bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl sm:text-8xl font-black text-foreground mb-4 tracking-tight">
            Features
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to run your solar service business — from work orders to customer feedback.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {FEATURES.map((category) => (
            <div key={category.category} className="mb-16 last:mb-0">
              <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <i className={`fas ${category.categoryIcon} text-xl text-primary`}></i>
                </div>
                {category.category}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.features.map((feature) => (
                  <div
                    key={feature.name}
                    className="bg-card border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <i className={`fas ${feature.icon} text-xl text-primary`}></i>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to streamline your solar service operations?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Join solar service teams using Crewatt to manage their field operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="gap-2">
                <i className="fas fa-user-plus"></i>
                Create Free Account
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Crewatt. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
