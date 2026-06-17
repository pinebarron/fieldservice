import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ContactForm } from './ContactForm';

export default function ContactPage() {
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
            <Link href="/plans" className="text-muted-foreground hover:text-foreground font-medium text-sm">
              Pricing
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

      {/* Hero */}
      <section className="pt-12 pb-8 sm:pt-16 sm:pb-12 bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-black text-foreground mb-4 tracking-tight">
            Contact Us
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a question or need support? We're here to help.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <ContactForm />
        </div>
      </section>

      {/* Alternative Contact Methods */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-envelope text-primary text-xl"></i>
              </div>
              <h3 className="font-semibold mb-2">Email Us</h3>
              <a href="mailto:hello@crewatt.com" className="text-primary hover:underline">
                hello@crewatt.com
              </a>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-clock text-primary text-xl"></i>
              </div>
              <h3 className="font-semibold mb-2">Response Time</h3>
              <p className="text-muted-foreground text-sm">
                We typically respond within 24 hours
              </p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-book text-primary text-xl"></i>
              </div>
              <h3 className="font-semibold mb-2">Documentation</h3>
              <p className="text-muted-foreground text-sm">
                Coming soon
              </p>
            </div>
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
