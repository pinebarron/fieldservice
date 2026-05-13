import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { User, BusinessMember } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const ROLES = [
  { value: "admin", label: "Admin", description: "Full access to all features", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "manager", label: "Manager", description: "Manage team and view reports", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "field_staff", label: "Field Staff", description: "Create and manage work logs", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "customer", label: "Customer", description: "View their own work history", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "technician", label: "Technician", description: "Field technician role", color: "bg-teal-100 text-teal-800 border-teal-200" },
];

function roleBadge(role: string) {
  const r = ROLES.find((x) => x.value === role) ?? { label: role, color: "bg-gray-100 text-gray-700 border-gray-200" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${r.color}`}>
      {r.label}
    </span>
  );
}

export function TeamManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [selectedRole, setSelectedRole] = useState("field_staff");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: members = [], isLoading } = useQuery<(BusinessMember & { user: User })[]>({
    queryKey: ["/api/business/members"],
  });

  const addMemberMutation = useMutation({
    mutationFn: (data: { email: string; firstName: string; lastName: string; role: string }) =>
      apiRequest("POST", "/api/business/members", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/members"] });
      setIsAddDialogOpen(false);
      setEmployeeEmail("");
      setEmployeeFirstName("");
      setEmployeeLastName("");
      setSelectedRole("field_staff");
      toast({ title: "Team member added" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to add member", variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiRequest("PATCH", `/api/business/members/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/members"] });
      setEditingRoleId(null);
      toast({ title: "Role updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update role", variant: "destructive" }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => apiRequest("DELETE", `/api/business/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/members"] });
      toast({ title: "Member removed" });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove member", variant: "destructive" }),
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeEmail && employeeFirstName && employeeLastName) {
      addMemberMutation.mutate({ email: employeeEmail, firstName: employeeFirstName, lastName: employeeLastName, role: selectedRole });
    }
  };

  const roleCounts = ROLES.map((r) => ({
    ...r,
    count: members.filter((m) => m.role === r.value).length,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-clipboard-list text-primary-foreground text-xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">FieldCapture</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Service Work Logger</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <i className="fas fa-home mr-2"></i>
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <Link href="/properties">
                <Button variant="ghost" size="sm" data-testid="properties-link">
                  <i className="fas fa-building mr-2"></i>
                  <span className="hidden sm:inline">Properties</span>
                </Button>
              </Link>
              <Link href="/estimates">
                <Button variant="ghost" size="sm" data-testid="estimates-link">
                  <i className="fas fa-file-invoice-dollar mr-2"></i>
                  <span className="hidden sm:inline">Estimates</span>
                </Button>
              </Link>
              <Link href="/team">
                <Button variant="ghost" size="sm" className="text-primary font-medium" data-testid="team-link">
                  <i className="fas fa-users mr-2"></i>
                  <span className="hidden sm:inline">Team</span>
                </Button>
              </Link>
              <Link href="/vendors">
                <Button variant="ghost" size="sm" data-testid="vendors-link">
                  <i className="fas fa-handshake mr-2"></i>
                  <span className="hidden sm:inline">Vendors</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = "/api/logout"} data-testid="logout-button">
                <i className="fas fa-sign-out-alt mr-2"></i>
                <span className="hidden sm:inline">Logout</span>
              </Button>
              <div className="flex items-center gap-2">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Team Management</h2>
            <p className="text-muted-foreground mt-1">
              Manage users, roles, and permissions for your organization
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-member">
            <i className="fas fa-user-plus mr-2"></i>
            Add Team Member
          </Button>
        </div>

        {/* Role summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {roleCounts.map((r) => (
            <Card key={r.value} className="text-center">
              <CardContent className="p-3">
                <p className="text-2xl font-bold">{r.count}</p>
                <p className="text-xs text-muted-foreground">{r.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Role legend */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-3">Role Permissions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ROLES.map((r) => (
                <div key={r.value} className="flex items-start gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium mt-0.5 whitespace-nowrap ${r.color}`}>
                    {r.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Members list */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <i className="fas fa-spinner fa-spin text-2xl mb-3"></i>
                <p>Loading team...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <i className="fas fa-users text-4xl mb-4 opacity-40"></i>
                <p className="font-medium mb-1">No team members yet</p>
                <p className="text-sm">Add your first team member to get started.</p>
              </div>
            ) : (
              <div>
                {members.map((member, index) => (
                  <div key={member.id}>
                    {index > 0 && <Separator />}
                    <div
                      className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
                      data-testid={`member-row-${member.id}`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {member.user.profileImageUrl ? (
                          <img
                            src={member.user.profileImageUrl}
                            alt={`${member.user.firstName} ${member.user.lastName}`}
                            className="w-11 h-11 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <i className="fas fa-user text-primary"></i>
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium" data-testid={`member-name-${member.id}`}>
                              {member.user.firstName} {member.user.lastName}
                              {member.user.id === user?.id && (
                                <span className="ml-1 text-sm text-muted-foreground">(You)</span>
                              )}
                            </p>
                            {roleBadge(member.role)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate" data-testid={`member-email-${member.id}`}>
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      {member.user.id !== user?.id && (
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          {editingRoleId === member.id ? (
                            <div className="flex items-center gap-2">
                              <Select
                                defaultValue={member.role}
                                onValueChange={(role) => updateRoleMutation.mutate({ id: member.id, role })}
                              >
                                <SelectTrigger className="w-36 h-8 text-xs" data-testid={`select-role-${member.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLES.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingRoleId(null)}
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingRoleId(member.id)}
                              data-testid={`button-change-role-${member.id}`}
                            >
                              <i className="fas fa-shield-alt mr-1"></i>
                              Role
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeMemberMutation.mutate(member.id)}
                            disabled={removeMemberMutation.isPending}
                            data-testid={`button-remove-${member.id}`}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite a new user and assign them a role in your organization.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  data-testid="input-member-first-name"
                  placeholder="Jane"
                  value={employeeFirstName}
                  onChange={(e) => setEmployeeFirstName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  data-testid="input-member-last-name"
                  placeholder="Doe"
                  value={employeeLastName}
                  onChange={(e) => setEmployeeLastName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                data-testid="input-member-email"
                type="email"
                placeholder="jane@company.com"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role" className="mt-1" data-testid="select-member-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div>
                        <span className="font-medium">{r.label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{r.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                disabled={addMemberMutation.isPending || !employeeEmail.trim() || !employeeFirstName.trim() || !employeeLastName.trim()}
                data-testid="button-submit-member"
              >
                {addMemberMutation.isPending ? "Adding..." : "Add Member"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
