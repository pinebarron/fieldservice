import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Field Capture
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Professional work log management for solar and industrial field service teams
          </p>
          <p className="text-base text-muted-foreground mb-6">
            New users will be prompted to create their business account after signing in
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleLogin}
              data-testid="login-button"
              className="text-lg px-8 py-6"
            >
              Get Started - Sign Up or Sign In
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-clipboard-list text-primary text-2xl"></i>
              </div>
              <CardTitle>Track Work Logs</CardTitle>
              <CardDescription>
                Record detailed work performed, customer information, and service details in one place
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-users text-primary text-2xl"></i>
              </div>
              <CardTitle>Manage Your Crew</CardTitle>
              <CardDescription>
                Add employees to your business and track which technician worked on each job
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-camera text-primary text-2xl"></i>
              </div>
              <CardTitle>Upload Photos & Reports</CardTitle>
              <CardDescription>
                Attach images and PDF reports to document your work with cloud storage
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
