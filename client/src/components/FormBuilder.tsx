import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicForm } from "@/components/DynamicForm";
import type { FormSchema, FormLogicRule, FormFieldDefinition, FormFieldType } from "@shared/schema";

const FIELD_TYPES: { value: FormFieldType; label: string; icon: string }[] = [
  { value: "text", label: "Text", icon: "fa-font" },
  { value: "textarea", label: "Long Text", icon: "fa-align-left" },
  { value: "number", label: "Number", icon: "fa-hashtag" },
  { value: "date", label: "Date", icon: "fa-calendar" },
  { value: "time", label: "Time", icon: "fa-clock" },
  { value: "select", label: "Dropdown", icon: "fa-list" },
  { value: "multiselect", label: "Multi-Select", icon: "fa-check-square" },
  { value: "checkbox", label: "Checkbox", icon: "fa-check" },
  { value: "radio", label: "Radio Buttons", icon: "fa-dot-circle" },
  { value: "photo", label: "Photo", icon: "fa-camera" },
  { value: "signature", label: "Signature", icon: "fa-signature" },
  { value: "gps", label: "GPS Location", icon: "fa-map-marker-alt" },
];

const OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "greater_than", label: "is greater than" },
  { value: "less_than", label: "is less than" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
];

const ACTION_TYPES = [
  { value: "show", label: "Show field" },
  { value: "hide", label: "Hide field" },
  { value: "require", label: "Make required" },
  { value: "unrequire", label: "Make optional" },
  { value: "create_task", label: "Create task" },
];

interface FormBuilderProps {
  initialSchema?: FormSchema;
  initialLogicRules?: FormLogicRule[];
  onSave: (schema: FormSchema, logicRules: FormLogicRule[]) => void;
  onCancel: () => void;
}

export function FormBuilder({
  initialSchema = { fields: [] },
  initialLogicRules = [],
  onSave,
  onCancel,
}: FormBuilderProps) {
  const [schema, setSchema] = useState<FormSchema>(initialSchema);
  const [logicRules, setLogicRules] = useState<FormLogicRule[]>(initialLogicRules);
  const [activeTab, setActiveTab] = useState("fields");
  const [editingField, setEditingField] = useState<FormFieldDefinition | null>(null);
  const [editingRule, setEditingRule] = useState<FormLogicRule | null>(null);

  // Field operations
  const addField = (type: FormFieldType) => {
    const newField: FormFieldDefinition = {
      id: `field-${Date.now()}`,
      type,
      label: `New ${FIELD_TYPES.find((t) => t.value === type)?.label || "Field"}`,
      required: false,
    };
    setSchema((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
    setEditingField(newField);
  };

  const updateField = (updatedField: FormFieldDefinition) => {
    setSchema((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === updatedField.id ? updatedField : f)),
    }));
    setEditingField(null);
  };

  const deleteField = (fieldId: string) => {
    setSchema((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== fieldId),
    }));
    // Also remove any rules that reference this field
    setLogicRules((prev) =>
      prev.filter((r) => r.condition.field !== fieldId && r.action.target !== fieldId)
    );
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= schema.fields.length) return;

    const newFields = [...schema.fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setSchema((prev) => ({ ...prev, fields: newFields }));
  };

  // Logic rule operations
  const addRule = () => {
    if (schema.fields.length < 2) return;

    const newRule: FormLogicRule = {
      id: `rule-${Date.now()}`,
      condition: {
        field: schema.fields[0].id,
        operator: "equals",
        value: "",
      },
      action: {
        type: "show",
        target: schema.fields[1].id,
      },
    };
    setLogicRules((prev) => [...prev, newRule]);
    setEditingRule(newRule);
  };

  const updateRule = (updatedRule: FormLogicRule) => {
    setLogicRules((prev) => prev.map((r) => (r.id === updatedRule.id ? updatedRule : r)));
    setEditingRule(null);
  };

  const deleteRule = (ruleId: string) => {
    setLogicRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="logic">Conditional Logic</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Field list */}
            <div className="space-y-3">
              <h3 className="font-medium">Form Fields ({schema.fields.length})</h3>

              {schema.fields.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <i className="fas fa-inbox text-3xl mb-2"></i>
                    <p>No fields yet. Add a field from the panel on the right.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {schema.fields.map((field, index) => (
                    <Card key={field.id} className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => moveField(index, "up")}
                            disabled={index === 0}
                          >
                            <i className="fas fa-chevron-up text-xs"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => moveField(index, "down")}
                            disabled={index === schema.fields.length - 1}
                          >
                            <i className="fas fa-chevron-down text-xs"></i>
                          </Button>
                        </div>

                        <div
                          className="flex-1"
                          onClick={() => setEditingField(field)}
                        >
                          <div className="flex items-center gap-2">
                            <i
                              className={`fas ${
                                FIELD_TYPES.find((t) => t.value === field.type)?.icon
                              } text-muted-foreground`}
                            ></i>
                            <span className="font-medium">{field.label}</span>
                            {field.required && (
                              <span className="text-xs text-red-500">Required</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {FIELD_TYPES.find((t) => t.value === field.type)?.label}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => deleteField(field.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Add field panel */}
            <div>
              <h3 className="font-medium mb-3">Add Field</h3>
              <div className="grid grid-cols-2 gap-2">
                {FIELD_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant="outline"
                    className="justify-start h-auto py-3"
                    onClick={() => addField(type.value)}
                  >
                    <i className={`fas ${type.icon} mr-2 text-muted-foreground`}></i>
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logic" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Conditional Logic Rules ({logicRules.length})</h3>
              <Button
                onClick={addRule}
                disabled={schema.fields.length < 2}
                size="sm"
              >
                <i className="fas fa-plus mr-2"></i> Add Rule
              </Button>
            </div>

            {schema.fields.length < 2 && (
              <p className="text-sm text-muted-foreground">
                Add at least 2 fields to create conditional logic rules.
              </p>
            )}

            {logicRules.length === 0 && schema.fields.length >= 2 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <i className="fas fa-code-branch text-3xl mb-2"></i>
                  <p>No logic rules yet. Add a rule to make fields conditional.</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {logicRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setEditingRule(rule)}
                      >
                        <p className="text-sm">
                          <span className="text-muted-foreground">When </span>
                          <strong>
                            {schema.fields.find((f) => f.id === rule.condition.field)?.label ||
                              "Unknown"}
                          </strong>
                          <span className="text-muted-foreground">
                            {" "}
                            {OPERATORS.find((o) => o.value === rule.condition.operator)?.label}
                          </span>
                          {rule.condition.value !== undefined && (
                            <span className="text-primary"> "{String(rule.condition.value)}"</span>
                          )}
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Then </span>
                          <strong>
                            {ACTION_TYPES.find((a) => a.value === rule.action.type)?.label}
                          </strong>
                          {rule.action.type !== "create_task" && (
                            <>
                              <span className="text-muted-foreground">: </span>
                              <span className="text-primary">
                                {schema.fields.find((f) => f.id === rule.action.target)?.label ||
                                  "Unknown"}
                              </span>
                            </>
                          )}
                          {rule.action.type === "create_task" && rule.action.taskDetails && (
                            <>
                              <span className="text-muted-foreground">: </span>
                              <span className="text-primary">
                                "{rule.action.taskDetails.title}"
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Form Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {schema.fields.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Add some fields to see the form preview
                </p>
              ) : (
                <DynamicForm
                  schema={schema}
                  logicRules={logicRules}
                  onSubmit={(data) => console.log("Preview submit:", data)}
                  submitLabel="Submit (Preview)"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="flex gap-3 mt-6 pt-4 border-t">
        <Button className="flex-1" onClick={() => onSave(schema, logicRules)}>
          <i className="fas fa-save mr-2"></i> Save Form
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Field Editor Dialog */}
      <FieldEditorDialog
        field={editingField}
        onSave={updateField}
        onClose={() => setEditingField(null)}
      />

      {/* Rule Editor Dialog */}
      <RuleEditorDialog
        rule={editingRule}
        fields={schema.fields}
        onSave={updateRule}
        onClose={() => setEditingRule(null)}
      />
    </div>
  );
}

// Field Editor Dialog
function FieldEditorDialog({
  field,
  onSave,
  onClose,
}: {
  field: FormFieldDefinition | null;
  onSave: (field: FormFieldDefinition) => void;
  onClose: () => void;
}) {
  const [editedField, setEditedField] = useState<FormFieldDefinition | null>(null);
  const [optionsText, setOptionsText] = useState("");

  const hasOptions = field?.type === "select" || field?.type === "multiselect" || field?.type === "radio";

  // Update local state when field changes
  if (field && (!editedField || editedField.id !== field.id)) {
    setEditedField(field);
    setOptionsText(
      field.options?.map((o) => `${o.label}=${o.value}`).join("\n") || ""
    );
  }

  const handleSave = () => {
    if (!editedField) return;

    let options: { label: string; value: string }[] | undefined;
    if (hasOptions && optionsText.trim()) {
      options = optionsText
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const [label, value] = line.split("=");
          return { label: label.trim(), value: (value || label).trim() };
        });
    }

    onSave({ ...editedField, options });
    onClose();
  };

  if (!field || !editedField) return null;

  return (
    <Dialog open={!!field} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Field</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Label</Label>
            <Input
              value={editedField.label}
              onChange={(e) =>
                setEditedField((prev) => prev && { ...prev, label: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Placeholder</Label>
            <Input
              value={editedField.placeholder || ""}
              onChange={(e) =>
                setEditedField((prev) => prev && { ...prev, placeholder: e.target.value })
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="required"
              checked={editedField.required || false}
              onCheckedChange={(checked) =>
                setEditedField((prev) => prev && { ...prev, required: checked as boolean })
              }
            />
            <Label htmlFor="required">Required field</Label>
          </div>

          {hasOptions && (
            <div>
              <Label>Options (one per line, format: Label=value)</Label>
              <Textarea
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder={"Option 1=opt1\nOption 2=opt2\nOption 3=opt3"}
                rows={4}
              />
            </div>
          )}

          {(editedField.type === "number" ||
            editedField.type === "text" ||
            editedField.type === "textarea") && (
            <div className="grid grid-cols-2 gap-4">
              {editedField.type === "number" && (
                <>
                  <div>
                    <Label>Min Value</Label>
                    <Input
                      type="number"
                      value={editedField.validation?.min ?? ""}
                      onChange={(e) =>
                        setEditedField((prev) =>
                          prev && {
                            ...prev,
                            validation: {
                              ...prev.validation,
                              min: e.target.value ? Number(e.target.value) : undefined,
                            },
                          }
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Max Value</Label>
                    <Input
                      type="number"
                      value={editedField.validation?.max ?? ""}
                      onChange={(e) =>
                        setEditedField((prev) =>
                          prev && {
                            ...prev,
                            validation: {
                              ...prev.validation,
                              max: e.target.value ? Number(e.target.value) : undefined,
                            },
                          }
                        )
                      }
                    />
                  </div>
                </>
              )}
              {(editedField.type === "text" || editedField.type === "textarea") && (
                <>
                  <div>
                    <Label>Min Length</Label>
                    <Input
                      type="number"
                      value={editedField.validation?.minLength ?? ""}
                      onChange={(e) =>
                        setEditedField((prev) =>
                          prev && {
                            ...prev,
                            validation: {
                              ...prev.validation,
                              minLength: e.target.value ? Number(e.target.value) : undefined,
                            },
                          }
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Max Length</Label>
                    <Input
                      type="number"
                      value={editedField.validation?.maxLength ?? ""}
                      onChange={(e) =>
                        setEditedField((prev) =>
                          prev && {
                            ...prev,
                            validation: {
                              ...prev.validation,
                              maxLength: e.target.value ? Number(e.target.value) : undefined,
                            },
                          }
                        )
                      }
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <Button className="flex-1" onClick={handleSave}>
            Save
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Rule Editor Dialog
function RuleEditorDialog({
  rule,
  fields,
  onSave,
  onClose,
}: {
  rule: FormLogicRule | null;
  fields: FormFieldDefinition[];
  onSave: (rule: FormLogicRule) => void;
  onClose: () => void;
}) {
  const [editedRule, setEditedRule] = useState<FormLogicRule | null>(null);

  // Update local state when rule changes
  if (rule && (!editedRule || editedRule.id !== rule.id)) {
    setEditedRule(rule);
  }

  const handleSave = () => {
    if (!editedRule) return;
    onSave(editedRule);
    onClose();
  };

  if (!rule || !editedRule) return null;

  const needsValue = !["is_empty", "is_not_empty"].includes(editedRule.condition.operator);
  const isCreateTask = editedRule.action.type === "create_task";

  return (
    <Dialog open={!!rule} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Logic Rule</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-muted/30">
            <CardHeader className="py-2">
              <CardTitle className="text-sm">When this condition is true...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Field</Label>
                <Select
                  value={editedRule.condition.field}
                  onValueChange={(value) =>
                    setEditedRule((prev) =>
                      prev && { ...prev, condition: { ...prev.condition, field: value } }
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Operator</Label>
                <Select
                  value={editedRule.condition.operator}
                  onValueChange={(value) =>
                    setEditedRule((prev) =>
                      prev && {
                        ...prev,
                        condition: {
                          ...prev.condition,
                          operator: value as FormLogicRule["condition"]["operator"],
                        },
                      }
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {needsValue && (
                <div>
                  <Label>Value</Label>
                  <Input
                    value={String(editedRule.condition.value ?? "")}
                    onChange={(e) =>
                      setEditedRule((prev) =>
                        prev && {
                          ...prev,
                          condition: { ...prev.condition, value: e.target.value },
                        }
                      )
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Then perform this action...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Action</Label>
                <Select
                  value={editedRule.action.type}
                  onValueChange={(value) =>
                    setEditedRule((prev) =>
                      prev && {
                        ...prev,
                        action: {
                          ...prev.action,
                          type: value as FormLogicRule["action"]["type"],
                        },
                      }
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isCreateTask && (
                <div>
                  <Label>Target Field</Label>
                  <Select
                    value={editedRule.action.target}
                    onValueChange={(value) =>
                      setEditedRule((prev) =>
                        prev && { ...prev, action: { ...prev.action, target: value } }
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fields
                        .filter((f) => f.id !== editedRule.condition.field)
                        .map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isCreateTask && (
                <>
                  <div>
                    <Label>Task Title</Label>
                    <Input
                      value={editedRule.action.taskDetails?.title || ""}
                      onChange={(e) =>
                        setEditedRule((prev) =>
                          prev && {
                            ...prev,
                            action: {
                              ...prev.action,
                              taskDetails: {
                                ...prev.action.taskDetails,
                                title: e.target.value,
                              },
                            },
                          }
                        )
                      }
                      placeholder="e.g., Schedule follow-up repair"
                    />
                  </div>
                  <div>
                    <Label>Task Description (optional)</Label>
                    <Textarea
                      value={editedRule.action.taskDetails?.description || ""}
                      onChange={(e) =>
                        setEditedRule((prev) =>
                          prev && {
                            ...prev,
                            action: {
                              ...prev.action,
                              taskDetails: {
                                ...prev.action.taskDetails,
                                title: prev.action.taskDetails?.title || "",
                                description: e.target.value,
                              },
                            },
                          }
                        )
                      }
                      rows={2}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 mt-4">
          <Button className="flex-1" onClick={handleSave}>
            Save Rule
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
