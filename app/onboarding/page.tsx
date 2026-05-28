'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createBusiness } from './actions';
import { getEnabledIndustries, type IndustryConfig } from '@/lib/industries';

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enabledIndustries, setEnabledIndustries] = useState<IndustryConfig[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');

  useEffect(() => {
    const industries = getEnabledIndustries();
    setEnabledIndustries(industries);

    // Check for industry in URL params (from landing page signup)
    const urlIndustry = searchParams.get('industry');
    if (urlIndustry && industries.some(i => i.id === urlIndustry)) {
      setSelectedIndustry(urlIndustry);
    } else if (industries.length === 1) {
      setSelectedIndustry(industries[0].id);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.set('industry', selectedIndustry || 'solar');
    const result = await createBusiness(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // If successful, the server action redirects to /schedule
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clipboard-list text-primary-foreground text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Set Up Your Business</h1>
            <p className="text-muted-foreground mt-2">
              Tell us about your business to get started
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {/* Industry Selection - only show if multiple enabled */}
                {enabledIndustries.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      What industry are you in? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {enabledIndustries.map((industry) => (
                        <button
                          key={industry.id}
                          type="button"
                          onClick={() => setSelectedIndustry(industry.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedIndustry === industry.id
                              ? 'border-primary bg-primary/5'
                              : 'border-input hover:border-primary/50'
                          }`}
                        >
                          <i className={`fas ${industry.icon} text-xl mb-2 ${
                            selectedIndustry === industry.id ? 'text-primary' : 'text-muted-foreground'
                          }`}></i>
                          <p className="font-medium text-sm">{industry.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium mb-1">
                    Business Name *
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium mb-1">
                    Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium mb-1">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium mb-1">
                      State
                    </label>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="CA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium mb-1">
                      ZIP Code
                    </label>
                    <input
                      id="zipCode"
                      name="zipCode"
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1">
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-rocket mr-2"></i>
                      Get Started
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
      </div>
    }>
      <OnboardingForm />
    </Suspense>
  );
}
