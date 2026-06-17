import Link from 'next/link';
import { Button } from '@/components/ui/button';

const PLANS = [
  {
    name: 'Team',
    price: 39,
    description: 'For small crews getting started',
    teamSize: '1-5 team members',
    highlighted: false,
    features: [
      'Up to 5 team members',
      'Unlimited work orders',
      'GPS-verified photos',
      'Custom form templates',
      'Conditional field visibility',
      'Digital signatures',
      'Estimates & PDF generation',
      'Customer scorecards',
      'Mobile-first technician app',
      'Offline support',
      'Scheduling calendar',
      'Property management',
    ],
  },
  {
    name: 'Business',
    price: 49,
    description: 'For growing solar companies',
    teamSize: '1-10 team members',
    highlighted: true,
    badge: 'Most Popular',
    features: [
      'Up to 10 team members',
      'Everything in Team, plus:',
      'Priority email support',
      'Advanced reporting dashboard',
      'Vendor management',
      'Recurring job scheduling',
      'Custom branding on PDFs',
      'Photo verification overrides',
      'Team performance metrics',
      'Bulk job import',
    ],
  },
];

const FAQ = [
  {
    question: 'How does the free trial work?',
    answer: 'Start with a 14-day free trial on any plan. No credit card required. You get full access to all features so you can test everything with your team.',
  },
  {
    question: 'Can I switch plans later?',
    answer: 'Yes, you can upgrade or downgrade at any time. Changes take effect on your next billing cycle.',
  },
  {
    question: 'What happens if I need more than 10 team members?',
    answer: 'Contact us for custom Enterprise pricing. We offer volume discounts for larger teams.',
  },
  {
    question: 'Is there a contract or commitment?',
    answer: 'No contracts. Pay month-to-month and cancel anytime. We also offer annual billing with 2 months free.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor.',
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes! Pay annually and get 2 months free. That\'s $390/year for Team (vs $468) and $490/year for Business (vs $588).',
  },
];

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/icons/crewatt-logo-primary.svg" alt="Crewatt" className="h-10" />
          </Link>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/features" className="text-muted-foreground hover:text-foreground font-medium text-sm">
              Features
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground font-medium text-sm">
              Contact
            </Link>
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Start Free Trial</Button>
            </Link>
          </div>
          <div className="sm:hidden flex items-center gap-2">
            <Link href="/login" className="text-muted-foreground hover:text-foreground text-sm">Log In</Link>
            <Link href="/signup">
              <Button size="sm">Start Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-12 pb-8 sm:pt-16 sm:pb-12 bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-6xl font-black text-foreground mb-4 tracking-tight">
            Simple, Honest Pricing
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
            One flat price for your whole team. No per-seat fees. No surprises.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`bg-card rounded-2xl p-8 relative ${
                  plan.highlighted ? 'border-2 border-primary' : 'border-2 border-muted'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-2xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="mb-2">
                  <span className="text-5xl font-black">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-primary font-medium mb-6">{plan.teamSize}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <i className="fas fa-check text-green-500 w-5 mt-0.5"></i>
                      <span className={feature.startsWith('Everything') ? 'font-medium text-foreground' : ''}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button
                    className="w-full"
                    size="lg"
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  14-day free trial &bull; No credit card required
                </p>
              </div>
            ))}
          </div>

          {/* Enterprise callout */}
          <div className="mt-8 bg-muted/50 border rounded-xl p-6 text-center">
            <h4 className="font-semibold text-foreground mb-2">Need more than 10 team members?</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Contact us for custom Enterprise pricing with volume discounts, dedicated support, and custom integrations.
            </p>
            <Link href="/contact">
              <Button variant="outline">Contact Sales</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value comparison */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            How we compare
          </h2>
          <div className="bg-card border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold"></th>
                  <th className="text-center p-4 font-semibold text-primary">Crewatt</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">SiteCapture</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Jobber</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium">Team of 5 (monthly)</td>
                  <td className="text-center p-4 font-bold text-primary">$39</td>
                  <td className="text-center p-4 text-muted-foreground">$100+</td>
                  <td className="text-center p-4 text-muted-foreground">$245+</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Solar-specific features</td>
                  <td className="text-center p-4"><i className="fas fa-check text-green-500"></i></td>
                  <td className="text-center p-4"><i className="fas fa-check text-green-500"></i></td>
                  <td className="text-center p-4"><i className="fas fa-times text-red-400"></i></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">GPS-verified photos</td>
                  <td className="text-center p-4"><i className="fas fa-check text-green-500"></i></td>
                  <td className="text-center p-4"><i className="fas fa-check text-green-500"></i></td>
                  <td className="text-center p-4"><i className="fas fa-times text-red-400"></i></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Offline mode</td>
                  <td className="text-center p-4"><i className="fas fa-check text-green-500"></i></td>
                  <td className="text-center p-4 text-muted-foreground">Limited</td>
                  <td className="text-center p-4 text-muted-foreground">Limited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Custom forms</td>
                  <td className="text-center p-4"><i className="fas fa-check text-green-500"></i></td>
                  <td className="text-center p-4"><i className="fas fa-check text-green-500"></i></td>
                  <td className="text-center p-4 text-muted-foreground">Add-on</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Per-seat pricing</td>
                  <td className="text-center p-4 font-medium text-green-600">No</td>
                  <td className="text-center p-4 text-muted-foreground">Yes</td>
                  <td className="text-center p-4 text-muted-foreground">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Annual savings callout */}
      <section className="py-12 sm:py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full mb-4">
              <i className="fas fa-piggy-bank"></i>
              Save with Annual Billing
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Get 2 months free when you pay annually
            </h3>
            <div className="grid sm:grid-cols-2 gap-6 max-w-lg mx-auto">
              <div className="bg-card border rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Team (Annual)</div>
                <div className="text-2xl font-bold">$390<span className="text-base font-normal text-muted-foreground">/year</span></div>
                <div className="text-xs text-green-600">Save $78</div>
              </div>
              <div className="bg-card border rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Business (Annual)</div>
                <div className="text-2xl font-bold">$490<span className="text-base font-normal text-muted-foreground">/year</span></div>
                <div className="text-xs text-green-600">Save $98</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-card border rounded-xl p-6">
                <h4 className="font-semibold text-foreground mb-2">{item.question}</h4>
                <p className="text-muted-foreground text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Start your free trial today
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            No credit card required. Full access to all features for 14 days. See why solar teams are switching to Crewatt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="gap-2">
                <i className="fas fa-rocket"></i>
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/">
                <img src="/icons/crewatt-logo-primary.svg" alt="Crewatt" className="h-8" />
              </Link>
              <div className="flex items-center gap-4 text-sm">
                <Link href="/features" className="text-muted-foreground hover:text-foreground">Features</Link>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Crewatt. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
