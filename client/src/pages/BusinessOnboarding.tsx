import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BusinessOnboarding() {
  const [businessName, setBusinessName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const createBusinessMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/business", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business"] });
      toast({
        title: "Success",
        description: "Your business has been created!",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create business",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (businessName.trim()) {
      createBusinessMutation.mutate(businessName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2">Welcome to Crewatt!</CardTitle>
          <CardDescription>
            Let's set up your business account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                data-testid="input-business-name"
                type="text"
                placeholder="Enter your business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="mt-2"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={createBusinessMutation.isPending || !businessName.trim()}
              data-testid="button-create-business"
            >
              {createBusinessMutation.isPending ? "Creating..." : "Create Business"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
