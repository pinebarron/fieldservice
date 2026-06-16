import { validateInviteToken } from './actions';
import { AcceptInviteForm } from './AcceptInviteForm';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-2xl text-destructive"></i>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Invite Link</h1>
          <p className="text-muted-foreground mb-6">
            This invite link is missing the required token. Please check the link and try again.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <i className="fas fa-arrow-left"></i>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const result = await validateInviteToken(token);

  if (result.error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-2xl text-destructive"></i>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {result.error === 'This invite has already been accepted' ? 'Invite Already Used' : 'Invalid Invite'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {result.error}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <i className="fas fa-arrow-left"></i>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-hard-hat text-primary-foreground text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to Crewatt</h1>
          <p className="text-muted-foreground mt-2">
            You've been invited to join <strong>{result.invite?.businessName}</strong>
          </p>
        </div>

        {/* Invite details */}
        <div className="bg-muted/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <i className="fas fa-user text-primary"></i>
            </div>
            <div>
              <p className="font-medium text-foreground">{result.invite?.email}</p>
              <p className="text-sm text-muted-foreground capitalize">
                Role: {result.invite?.role}
              </p>
            </div>
          </div>
        </div>

        <AcceptInviteForm
          token={token}
          email={result.invite?.email || ''}
          firstName={result.invite?.firstName || ''}
          lastName={result.invite?.lastName || ''}
        />

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
