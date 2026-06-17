import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const PAIN_POINTS = [
  {
    pain: 'Photo chaos after every job?',
    solution: 'GPS-verified photos auto-organized by job, date, and type',
    icon: 'fa-camera',
  },
  {
    pain: 'Crew on site but no update?',
    solution: 'Real-time check-in with location verification',
    icon: 'fa-map-marker-alt',
  },
  {
    pain: 'Software dies on the roof?',
    solution: 'Offline-first — works without signal, syncs when back',
    icon: 'fa-wifi-slash',
  },
  {
    pain: 'Paying per seat adds up fast?',
    solution: 'Flat monthly pricing for your whole team',
    icon: 'fa-dollar-sign',
  },
];

const FEATURES = [
  {
    name: 'Work Orders',
    description: 'Create, schedule, and track jobs from estimate to completion',
    icon: 'fa-clipboard-list',
  },
  {
    name: 'GPS Photo Verification',
    description: 'Prove your crew was on-site with timestamped, geotagged photos',
    icon: 'fa-map-pin',
  },
  {
    name: 'Drag-Drop Scheduling',
    description: 'Visual calendar to manage your crew\'s daily and weekly schedule',
    icon: 'fa-calendar-alt',
  },
  {
    name: 'Customer Feedback',
    description: 'Automated scorecards to collect ratings after every job',
    icon: 'fa-star',
  },
  {
    name: 'Offline Mode',
    description: 'Full functionality without internet — perfect for rooftops',
    icon: 'fa-cloud-download-alt',
  },
  {
    name: 'Custom Forms',
    description: 'Build inspection checklists, site surveys, and sign-off forms',
    icon: 'fa-file-alt',
  },
  {
    name: 'Digital Signatures',
    description: 'Capture customer approvals directly on your mobile device',
    icon: 'fa-signature',
  },
  {
    name: 'Estimates & PDFs',
    description: 'Create branded estimates and send professional PDFs',
    icon: 'fa-file-invoice-dollar',
  },
  {
    name: 'Team Management',
    description: 'Invite technicians, assign jobs, track who did what',
    icon: 'fa-users',
  },
];

const STATS = [
  { value: '38%', label: 'of installers cite scheduling as top challenge' },
  { value: '$50-100', label: 'typical per-user monthly cost for FSM software' },
  { value: '12,000+', label: 'solar installation companies in North America' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/icons/crewatt-logo-dark.svg" alt="Crewatt" className="h-10" />
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/features" className="text-white/80 hover:text-white font-medium text-sm transition-colors">
              Features
            </Link>
            <Link href="/plans" className="text-white/80 hover:text-white font-medium text-sm transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="text-white/80 hover:text-white font-medium text-sm transition-colors">
              Contact
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-white text-gray-900 hover:bg-white/90">Start Free Trial</Button>
            </Link>
          </div>
          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center gap-2">
            <Link href="/login" className="text-white/80 hover:text-white text-sm">Log In</Link>
            <Link href="/signup">
              <Button size="sm" className="bg-white text-gray-900 hover:bg-white/90">Start Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full min-h-[600px] md:min-h-[700px] overflow-hidden">
        <Image
          src="/solar_home.png"
          alt="Solar installation team"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        <div className="absolute inset-0 flex items-center justify-center pt-16">
          <div className="text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
              Field Service Built for<br />
              <span className="text-primary">Solar Crews</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
              GPS-verified photos. Offline-ready. Simple scheduling.<br className="hidden md:block" />
              All for one flat monthly price.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-primary hover:bg-primary/90">
                  Start Free Trial
                  <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 bg-white/10 text-white border-white/30 hover:bg-white/20">
                  See All Features
                </Button>
              </Link>
            </div>
            <p className="text-white/60 text-sm">
              No credit card required &bull; Set up in 5 minutes &bull; Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="bg-muted/50 border-y py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-center">
            {STATS.map((stat, i) => (
              <div key={i}>
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Sound familiar?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We built Crewatt to solve the daily headaches of running a solar field service team.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {PAIN_POINTS.map((item, i) => (
              <div key={i} className="bg-card border rounded-xl p-6 flex gap-4 hover:border-primary/50 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className={`fas ${item.icon} text-xl text-primary`}></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{item.pain}</h3>
                  <p className="text-muted-foreground">{item.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything your team needs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Purpose-built for solar installation and service teams. Not adapted from generic software.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div key={i} className="bg-card border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <i className={`fas ${feature.icon} text-xl text-primary`}></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.name}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/features">
              <Button variant="outline" size="lg">
                View All Features
                <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No per-seat fees. No hidden costs. One price for your whole team.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Team Plan */}
            <div className="bg-card border-2 border-muted rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-foreground mb-2">Team</h3>
              <p className="text-muted-foreground text-sm mb-4">For small crews getting started</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">$39</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-green-500 w-5"></i>
                  <span>Up to <strong>5 team members</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-green-500 w-5"></i>
                  <span>Unlimited work orders</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-green-500 w-5"></i>
                  <span>GPS-verified photos</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-green-500 w-5"></i>
                  <span>Custom forms & signatures</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-green-500 w-5"></i>
                  <span>Offline mode</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-green-500 w-5"></i>
                  <span>Estimates & PDF generation</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-green-500 w-5"></i>
                  <span>Customer scorecards</span>
                </li>
              </ul>
              <Link href="/signup">
                <Button className="w-full" size="lg" variant="outline">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            {/* Business Plan */}
            <div className="bg-card border-2 border-primary rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Business</h3>
              <p className="text-muted-foreground text-sm mb-4">For growing solar companies</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">$49</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-green-500 w-5"></i>
                  <span>Up to <strong>10 team members</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-green-500 w-5"></i>
                  <span>Everything in Team, plus:</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-green-500 w-5"></i>
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-green-500 w-5"></i>
                  <span>Advanced reporting</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-green-500 w-5"></i>
                  <span>Vendor management</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-green-500 w-5"></i>
                  <span>Recurring job scheduling</span>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-check text-green-500 w-5"></i>
                  <span>Custom branding on PDFs</span>
                </li>
              </ul>
              <Link href="/signup">
                <Button className="w-full" size="lg">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-center text-muted-foreground text-sm mt-8">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why choose Crewatt?
            </h2>
          </div>
          <div className="bg-card border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold text-primary">Crewatt</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Others</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">Built for solar</td>
                  <td className="text-center p-4"><i className="fas fa-check text-green-500"></i></td>
                  <td className="text-center p-4 text-muted-foreground">Generic</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">GPS-verified photos</td>
                  <td className="text-center p-4"><i className="fas fa-check text-green-500"></i></td>
                  <td className="text-center p-4 text-muted-foreground">Add-on</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Offline mode</td>
                  <td className="text-center p-4"><i className="fas fa-check text-green-500"></i></td>
                  <td className="text-center p-4 text-muted-foreground">Limited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Team of 5 pricing</td>
                  <td className="text-center p-4 font-semibold text-primary">$39/mo</td>
                  <td className="text-center p-4 text-muted-foreground">$250-500/mo</td>
                </tr>
                <tr>
                  <td className="p-4">Per-seat fees</td>
                  <td className="text-center p-4"><i className="fas fa-times text-green-500"></i> None</td>
                  <td className="text-center p-4 text-muted-foreground">$50-100/user</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonial/Quote Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-card border rounded-2xl p-8 md:p-12">
            <i className="fas fa-quote-left text-4xl text-primary/20 mb-6"></i>
            <blockquote className="text-xl md:text-2xl text-foreground mb-6 italic">
              "Finally, software that works on the roof when there's no signal.
              My crew actually uses it because it's simple."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-primary"></i>
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground">Solar Installation Owner</div>
                <div className="text-sm text-muted-foreground">5-person residential team</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to simplify your field operations?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join solar teams using Crewatt to track jobs, verify work, and keep customers happy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Your Free Trial
                <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10">
                Talk to Us
              </Button>
            </Link>
          </div>
          <p className="text-primary-foreground/60 text-sm mt-6">
            14-day free trial &bull; No credit card required &bull; Set up in 5 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src="/icons/crewatt-logo-primary.svg" alt="Crewatt" className="h-8 mb-4" />
              <p className="text-sm text-muted-foreground">
                Field service management built for solar installation teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="text-muted-foreground hover:text-foreground">Features</Link></li>
                <li><Link href="/plans" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
                <li><Link href="/signup" className="text-muted-foreground hover:text-foreground">Free Trial</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Get Started</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="text-muted-foreground hover:text-foreground">Log In</Link></li>
                <li><Link href="/signup" className="text-muted-foreground hover:text-foreground">Create Account</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Crewatt. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
