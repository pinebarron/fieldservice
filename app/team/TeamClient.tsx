'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { addTeamMember, removeTeamMember } from './actions';

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  } | null;
}

interface TeamClientProps {
  members: Member[] | null;
}

export function TeamClient({ members }: TeamClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const result = await addTeamMember(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      router.refresh();
    }
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this team member?')) return;
    setDeleting(id);
    await removeTeamMember(id);
    router.refresh();
    setDeleting(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your team members</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <i className="fas fa-user-plus"></i>Add Member
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add Team Member</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input name="email" type="email" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="team@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input name="firstName" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input name="lastName" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select name="role" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="technician">Technician</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Adding...' : 'Add Member'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {!members || members.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-users text-2xl text-muted-foreground"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
            <p className="text-muted-foreground mb-4">Add team members to collaborate on jobs.</p>
            <Button onClick={() => setShowForm(true)}><i className="fas fa-user-plus mr-2"></i>Add First Member</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">
                    {member.user?.first_name?.[0] || member.user?.email?.[0]?.toUpperCase() || '?'}
                    {member.user?.last_name?.[0] || ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {member.user?.first_name || member.user?.last_name
                        ? `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim()
                        : member.user?.email}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{member.user?.email}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{member.role}</span>
                  </div>
                  <button onClick={() => handleRemove(member.id)} disabled={deleting === member.id} className="text-muted-foreground hover:text-destructive">
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
