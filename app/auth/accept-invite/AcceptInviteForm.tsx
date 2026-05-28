'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { acceptInvite } from './actions';

interface AcceptInviteFormProps {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
}

export function AcceptInviteForm({ token, email, firstName: initialFirstName, lastName: initialLastName }: AcceptInviteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.set('token', token);
    formData.set('password', password);
    formData.set('firstName', firstName);
    formData.set('lastName', lastName);

    const result = await acceptInvite(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.redirect) {
      router.push(result.redirect);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="First name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Last name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Create Password *</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="At least 8 characters"
          minLength={8}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Confirm Password *</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Confirm your password"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Setting up account...
          </>
        ) : (
          <>
            <i className="fas fa-check mr-2"></i>
            Create Account & Join
          </>
        )}
      </Button>
    </form>
  );
}
