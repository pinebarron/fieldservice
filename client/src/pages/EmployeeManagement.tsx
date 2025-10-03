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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: members = [], isLoading } = useQuery<(BusinessMember & { user: User })[]>({
    queryKey: ["/api/business/members"],
  });

  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("/api/business/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: "technician" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/members"] });
      setIsAddDialogOpen(false);
      setEmployeeEmail("");
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
      return await apiRequest(`/api/business/members/${memberId}`, {
        method: "DELETE",
      });
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
    // For now, we'll use the email as a placeholder for user ID
    // In a real system, you'd look up the user by email first
    addMemberMutation.mutate(employeeEmail);
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
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>
              Enter the user ID of the employee you want to add to your business
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <Label htmlFor="employee-id">Employee User ID</Label>
              <Input
                id="employee-id"
                data-testid="input-employee-id"
                type="text"
                placeholder="Enter user ID"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                required
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                The employee must have already signed in to get their user ID
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                type="submit"
                disabled={addMemberMutation.isPending || !employeeEmail.trim()}
                data-testid="button-submit-add-employee"
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
