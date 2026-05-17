import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FormBuilder } from "@/components/FormBuilder";
import { AppHeader } from "@/components/AppHeader";
import type { FormTemplate, FormSchema, FormLogicRule } from "@shared/schema";

const WORK_TYPES = [
  "Solar Installation",
  "Maintenance",
  "Inspection",
  "Repair",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Other",
];

export default function FormTemplates() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateWorkType, setNewTemplateWorkType] = useState("");
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderSchema, setBuilderSchema] = useState<FormSchema>({ fields: [] });
  const [builderRules, setBuilderRules] = useState<FormLogicRule[]>([]);

  const { data: templates = [], isLoading } = useQuery<FormTemplate[]>({
    queryKey: ["/api/form-templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      workType?: string;
      schema: FormSchema;
      logicRules: FormLogicRule[];
    }) => {
      const res = await apiRequest("POST", "/api/form-templates", {
        name: data.name,
        workType: data.workType || null,
        schema: data.schema,
        logicRules: data.logicRules,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Form template created." });
      queryClient.invalidateQueries({ queryKey: ["/api/form-templates"] });
      resetCreateState();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        workType?: string | null;
        schema?: FormSchema;
        logicRules?: FormLogicRule[];
        isActive?: string;
      };
    }) => {
      const res = await apiRequest("PATCH", `/api/form-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Form template updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/form-templates"] });
      setEditingTemplate(null);
      setShowBuilder(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update template.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/form-templates/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Form template deleted." });
      queryClient.invalidateQueries({ queryKey: ["/api/form-templates"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
    },
  });

  const resetCreateState = () => {
    setIsCreateOpen(false);
    setShowBuilder(false);
    setNewTemplateName("");
    setNewTemplateWorkType("");
    setBuilderSchema({ fields: [] });
    setBuilderRules([]);
  };

  const handleStartCreate = () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name.",
        variant: "destructive",
      });
      return;
    }
    setIsCreateOpen(false);
    setShowBuilder(true);
  };

  const handleSaveNewTemplate = (schema: FormSchema, logicRules: FormLogicRule[]) => {
    createMutation.mutate({
      name: newTemplateName,
      workType: newTemplateWorkType || undefined,
      schema,
      logicRules,
    });
  };

  const handleEditTemplate = (template: FormTemplate) => {
    setEditingTemplate(template);
    setBuilderSchema(template.schema as FormSchema);
    setBuilderRules((template.logicRules as FormLogicRule[]) || []);
    setShowBuilder(true);
  };

  const handleSaveEditedTemplate = (schema: FormSchema, logicRules: FormLogicRule[]) => {
    if (!editingTemplate) return;
    updateMutation.mutate({
      id: editingTemplate.id,
      data: { schema, logicRules },
    });
  };

  const toggleActive = (template: FormTemplate) => {
    updateMutation.mutate({
      id: template.id,
      data: { isActive: template.isActive === "true" ? "false" : "true" },
    });
  };

  // Show form builder full screen
  if (showBuilder) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 border-b bg-card flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold">
            {editingTemplate ? `Edit: ${editingTemplate.name}` : `New: ${newTemplateName}`}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowBuilder(false);
              setEditingTemplate(null);
              if (!editingTemplate) {
                setIsCreateOpen(true);
              }
            }}
          >
            <i className="fas fa-times mr-2"></i>
            Close
          </Button>
        </div>
        <div className="p-4">
          <FormBuilder
            initialSchema={builderSchema}
            initialLogicRules={builderRules}
            onSave={editingTemplate ? handleSaveEditedTemplate : handleSaveNewTemplate}
            onCancel={() => {
              setShowBuilder(false);
              setEditingTemplate(null);
              if (!editingTemplate) {
                setIsCreateOpen(true);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Form Templates</h1>
            <p className="text-muted-foreground">
              Create dynamic forms with conditional logic for your technicians
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <i className="fas fa-plus mr-2"></i> New Template
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground"></i>
          </div>
        ) : templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <i className="fas fa-file-alt text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-medium mb-2">No form templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create custom forms with conditional fields and auto-task creation
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <i className="fas fa-plus mr-2"></i> Create First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={template.isActive === "false" ? "opacity-60" : ""}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.workType && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <i className="fas fa-briefcase mr-1"></i>
                          {template.workType}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={template.isActive === "true"}
                        onCheckedChange={() => toggleActive(template)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>
                      <i className="fas fa-list mr-1"></i>
                      {(template.schema as FormSchema)?.fields?.length || 0} fields
                    </span>
                    <span>
                      <i className="fas fa-code-branch mr-1"></i>
                      {(template.logicRules as FormLogicRule[])?.length || 0} rules
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <i className="fas fa-edit mr-1"></i> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        if (confirm("Delete this template?")) {
                          deleteMutation.mutate(template.id);
                        }
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Template Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Form Template</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Template Name *</Label>
                <Input
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Inspection Checklist"
                />
              </div>

              <div>
                <Label>Work Type (Optional)</Label>
                <Select value={newTemplateWorkType} onValueChange={setNewTemplateWorkType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All work types" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  If set, this form will only appear for jobs with this work type
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button className="flex-1" onClick={handleStartCreate}>
                <i className="fas fa-pencil-alt mr-2"></i> Design Form
              </Button>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
