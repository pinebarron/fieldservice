'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { addTeamMember, updateTeamMember, removeTeamMember, getInviteUrl } from './actions';

interface Member {
  id: string;
  role: string;
  title?: string | null;
  phone?: string | null;
  invite_accepted_at?: string | null;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  } | {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  }[] | null;
}

interface TeamClientProps {
  members: Member[] | null;
}

export function TeamClient({ members }: TeamClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<{ alreadyAccepted?: boolean; email?: string; loginUrl?: string; message?: string } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('technician');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');

  const resetForm = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setRole('technician');
    setTitle('');
    setPhone('');
    setError('');
  };

  const openAddForm = () => {
    resetForm();
    setEditingMember(null);
    setShowForm(true);
  };

  const openEditForm = (member: Member) => {
    const user = Array.isArray(member.user) ? member.user[0] : member.user;
    setEmail(user?.email || '');
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setRole(member.role);
    setTitle(member.title || '');
    setPhone(member.phone || '');
    setEditingMember(member);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingMember(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.set('email', email);
    formData.set('firstName', firstName);
    formData.set('lastName', lastName);
    formData.set('role', role);
    formData.set('title', title);
    formData.set('phone', phone);

    if (editingMember) {
      const result = await updateTeamMember(editingMember.id, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        closeForm();
        router.refresh();
      }
    } else {
      const result = await addTeamMember(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.inviteUrl) {
        setInviteInfo(null);
        setInviteUrl(result.inviteUrl);
        closeForm();
        router.refresh();
      } else {
        closeForm();
        router.refresh();
      }
    }
    setLoading(false);
  };

  const handleCopyInvite = async () => {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  const handleShowInvite = async (memberId: string) => {
    const result = await getInviteUrl(memberId);
    if (result.error) {
      alert(result.error);
    } else if (result.alreadyAccepted) {
      setInviteInfo({
        alreadyAccepted: true,
        email: result.email,
        loginUrl: result.loginUrl,
        message: result.message
      });
      setInviteUrl(result.loginUrl || null);
    } else if (result.inviteUrl) {
      setInviteInfo(null);
      setInviteUrl(result.inviteUrl);
    }
  };

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
        <Button className="gap-2" onClick={openAddForm}>
          <i className="fas fa-user-plus"></i>Add Member
        </Button>
      </div>

      {/* Add/Edit Member Form */}
      {showForm && !inviteUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

                {!editingMember && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="team@example.com"
                    />
                  </div>
                )}

                {!editingMember && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="technician">Technician</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Lead Technician"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Saving...' : editingMember ? 'Save Changes' : 'Add Member'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite URL Modal */}
      {inviteUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              {inviteInfo?.alreadyAccepted ? (
                <>
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-user-check text-blue-600 text-xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold">Account Already Set Up</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {inviteInfo.message}
                    </p>
                  </div>

                  <div className="bg-muted p-3 rounded-lg mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Email:</p>
                    <p className="text-sm font-medium">{inviteInfo.email}</p>
                    <p className="text-xs text-muted-foreground mt-2 mb-1">Login URL:</p>
                    <p className="text-sm font-mono break-all">{inviteInfo.loginUrl}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyInvite}
                      className="flex-1"
                    >
                      <i className={`fas ${copiedInvite ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                      {copiedInvite ? 'Copied!' : 'Copy Login URL'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setInviteUrl(null);
                        setInviteInfo(null);
                      }}
                      className="flex-1"
                    >
                      Done
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-link text-green-600 text-xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold">Invite Link</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Share this link with them to set up their account
                    </p>
                  </div>

                  <div className="bg-muted p-3 rounded-lg mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Invite Link:</p>
                    <p className="text-sm font-mono break-all">{inviteUrl}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyInvite}
                      className="flex-1"
                    >
                      <i className={`fas ${copiedInvite ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                      {copiedInvite ? 'Copied!' : 'Copy Link'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setInviteUrl(null);
                        setInviteInfo(null);
                      }}
                      className="flex-1"
                    >
                      Done
                    </Button>
                  </div>
                </>
              )}
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
            <Button onClick={openAddForm}><i className="fas fa-user-plus mr-2"></i>Add First Member</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const user = Array.isArray(member.user) ? member.user[0] : member.user;
            const isPending = !member.invite_accepted_at;
            return (
              <Card
                key={member.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => openEditForm(member)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                      isPending ? 'bg-yellow-500' : 'bg-gradient-to-br from-primary to-accent'
                    }`}>
                      {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                      {user?.last_name?.[0] || ''}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {user?.first_name || user?.last_name
                          ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
                          : user?.email}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                      {member.title && (
                        <p className="text-sm text-foreground mt-1">{member.title}</p>
                      )}
                      {member.phone && (
                        <p className="text-xs text-muted-foreground">
                          <i className="fas fa-phone mr-1"></i>{member.phone}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{member.role}</span>
                        {isPending ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            <i className="fas fa-clock mr-1"></i>Pending
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            <i className="fas fa-check-circle mr-1"></i>Active
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowInvite(member.id);
                        }}
                        className="text-muted-foreground hover:text-primary text-sm"
                        title={isPending ? "Get invite link" : "Get login info"}
                      >
                        <i className={`fas ${isPending ? 'fa-link' : 'fa-info-circle'}`}></i>
                      </button>
                      <button
                        onClick={(e) => handleRemove(member.id, e)}
                        disabled={deleting === member.id}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
