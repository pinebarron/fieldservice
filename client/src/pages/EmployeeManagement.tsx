import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { User, BusinessMember } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export function EmployeeManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: members = [], isLoading } = useQuery<(BusinessMember & { user: User })[]>({
    queryKey: ["/api/business/members"],
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: { email: string; firstName: string; lastName: string }) => {
      return await apiRequest("POST", "/api/business/members", { 
        ...data, 
        role: "technician" 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/members"] });
      setIsAddDialogOpen(false);
      setEmployeeEmail("");
      setEmployeeFirstName("");
      setEmployeeLastName("");
      toast({
        title: "Success",
        description: "Employee added successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add employee",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return await apiRequest("DELETE", `/api/business/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/members"] });
      toast({
        title: "Success",
        description: "Employee removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove employee",
        variant: "destructive",
      });
    },
  });

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeEmail && employeeFirstName && employeeLastName) {
      addMemberMutation.mutate({
        email: employeeEmail,
        firstName: employeeFirstName,
        lastName: employeeLastName,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Employees</h1>
            <p className="text-muted-foreground mt-2">
              Add and manage your field service crew members
            </p>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            data-testid="button-add-employee"
          >
            <i className="fas fa-user-plus mr-2"></i>
            Add Employee
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Team</CardTitle>
            <CardDescription>
              {members.length} {members.length === 1 ? "employee" : "employees"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-users text-4xl mb-4 opacity-50"></i>
                <p>No employees yet. Add your first team member to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member, index) => (
                  <div key={member.id}>
                    {index > 0 && <Separator />}
                    <div 
                      className="flex items-center justify-between py-4"
                      data-testid={`employee-row-${member.id}`}
                    >
                      <div className="flex items-center gap-4">
                        {member.user.profileImageUrl ? (
                          <img 
                            src={member.user.profileImageUrl} 
                            alt={`${member.user.firstName} ${member.user.lastName}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <i className="fas fa-user text-primary text-xl"></i>
                          </div>
                        )}
                        <div>
                          <p className="font-medium" data-testid={`employee-name-${member.id}`}>
                            {member.user.firstName} {member.user.lastName}
                            {member.user.id === user?.id && (
                              <span className="ml-2 text-sm text-muted-foreground">(You)</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`employee-email-${member.id}`}>
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      {member.user.id !== user?.id && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeMemberMutation.mutate(member.id)}
                          disabled={removeMemberMutation.isPending}
                          data-testid={`button-remove-${member.id}`}
                        >
                          <i className="fas fa-trash mr-2"></i>
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter the employee's information to add them to your team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <Label htmlFor="employee-email">Email Address</Label>
              <Input
                id="employee-email"
                data-testid="input-employee-email"
                type="email"
                placeholder="employee@example.com"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="employee-first-name">First Name</Label>
              <Input
                id="employee-first-name"
                data-testid="input-employee-first-name"
                type="text"
                placeholder="John"
                value={employeeFirstName}
                onChange={(e) => setEmployeeFirstName(e.target.value)}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="employee-last-name">Last Name</Label>
              <Input
                id="employee-last-name"
                data-testid="input-employee-last-name"
                type="text"
                placeholder="Doe"
                value={employeeLastName}
                onChange={(e) => setEmployeeLastName(e.target.value)}
                required
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="submit"
                disabled={addMemberMutation.isPending || !employeeEmail.trim() || !employeeFirstName.trim() || !employeeLastName.trim()}
                data-testid="button-submit-employee"
              >
                {addMemberMutation.isPending ? "Adding..." : "Add Employee"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
