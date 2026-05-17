import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FormSchema, FormLogicRule, FormFieldDefinition } from "@shared/schema";
import {
  createInitialFormState,
  updateFormState,
  validateFormState,
  getVisibleFields,
  isFieldRequired,
  type FormState,
} from "@/lib/formLogicEngine";

interface DynamicFormProps {
  schema: FormSchema;
  logicRules: FormLogicRule[];
  initialValues?: Record<string, unknown>;
  onSubmit: (data: {
    values: Record<string, unknown>;
    tasksToCreate: Array<{ title: string; description?: string }>;
  }) => void;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  readOnly?: boolean;
}

export function DynamicForm({
  schema,
  logicRules,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Submit",
  isSubmitting = false,
  readOnly = false,
}: DynamicFormProps) {
  const [formState, setFormState] = useState<FormState>(() =>
    createInitialFormState(schema, logicRules, initialValues)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Re-evaluate when logic rules change
  useEffect(() => {
    setFormState(createInitialFormState(schema, logicRules, formState.values));
  }, [schema, logicRules]);

  const handleFieldChange = useCallback(
    (fieldId: string, value: unknown) => {
      const newState = updateFormState(schema, logicRules, formState.values, fieldId, value);
      setFormState(newState);

      // Clear error when field changes
      if (errors[fieldId]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[fieldId];
          return next;
        });
      }
    },
    [schema, logicRules, formState.values, errors]
  );

  const handleFieldBlur = useCallback((fieldId: string) => {
    setTouched((prev) => new Set(prev).add(fieldId));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateFormState(schema, formState);
    if (!validation.valid) {
      setErrors(validation.errors);
      setTouched(new Set(Object.keys(validation.errors)));
      return;
    }

    onSubmit({
      values: formState.values,
      tasksToCreate: formState.tasksToCreate,
    });
  };

  const visibleFields = getVisibleFields(schema, formState);

  // Group fields by section if sections are defined
  const renderFields = () => {
    if (schema.sections && schema.sections.length > 0) {
      return schema.sections.map((section) => {
        const sectionFields = visibleFields.filter((f) =>
          section.fieldIds.includes(f.id)
        );
        if (sectionFields.length === 0) return null;

        return (
          <Card key={section.id} className="mb-4">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sectionFields.map((field) => renderField(field))}
            </CardContent>
          </Card>
        );
      });
    }

    return (
      <div className="space-y-4">
        {visibleFields.map((field) => renderField(field))}
      </div>
    );
  };

  const renderField = (field: FormFieldDefinition) => {
    const value = formState.values[field.id];
    const required = isFieldRequired(field.id, formState);
    const error = touched.has(field.id) ? errors[field.id] : undefined;

    return (
      <div key={field.id} className="space-y-2">
        {field.type !== "checkbox" && (
          <Label htmlFor={field.id} className="flex items-center gap-1">
            {field.label}
            {required && <span className="text-red-500">*</span>}
          </Label>
        )}

        {renderFieldInput(field, value, required, error)}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  };

  const renderFieldInput = (
    field: FormFieldDefinition,
    value: unknown,
    required: boolean,
    error?: string
  ) => {
    const baseProps = {
      id: field.id,
      disabled: readOnly || isSubmitting,
      onBlur: () => handleFieldBlur(field.id),
      className: error ? "border-red-500" : "",
    };

    switch (field.type) {
      case "text":
        return (
          <Input
            {...baseProps}
            type="text"
            value={(value as string) || ""}
            placeholder={field.placeholder}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case "number":
        return (
          <Input
            {...baseProps}
            type="number"
            value={(value as number) ?? ""}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            onChange={(e) =>
              handleFieldChange(field.id, e.target.value ? Number(e.target.value) : undefined)
            }
          />
        );

      case "textarea":
        return (
          <Textarea
            {...baseProps}
            value={(value as string) || ""}
            placeholder={field.placeholder}
            rows={4}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case "date":
        return (
          <Input
            {...baseProps}
            type="date"
            value={(value as string) || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case "time":
        return (
          <Input
            {...baseProps}
            type="time"
            value={(value as string) || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case "select":
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={(v) => handleFieldChange(field.id, v)}
            disabled={readOnly || isSubmitting}
          >
            <SelectTrigger id={field.id} className={error ? "border-red-500" : ""}>
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-2 border rounded-md p-3">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  disabled={readOnly || isSubmitting}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((v) => v !== option.value);
                    handleFieldChange(field.id, newValues);
                  }}
                />
                <Label
                  htmlFor={`${field.id}-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={(value as boolean) || false}
              disabled={readOnly || isSubmitting}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <Label htmlFor={field.id} className="text-sm font-normal cursor-pointer">
              {field.label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      case "radio":
        return (
          <RadioGroup
            value={(value as string) || ""}
            onValueChange={(v) => handleFieldChange(field.id, v)}
            disabled={readOnly || isSubmitting}
          >
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                <Label
                  htmlFor={`${field.id}-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "photo":
        // Photo field will be handled by parent component
        return (
          <div className="border-2 border-dashed rounded-md p-4 text-center text-muted-foreground">
            <i className="fas fa-camera text-2xl mb-2"></i>
            <p className="text-sm">Photo capture field - handled by parent</p>
          </div>
        );

      case "signature":
        return (
          <div className="border-2 border-dashed rounded-md p-4 text-center text-muted-foreground">
            <i className="fas fa-signature text-2xl mb-2"></i>
            <p className="text-sm">Signature capture field</p>
          </div>
        );

      case "gps":
        return (
          <div className="border rounded-md p-3 bg-muted/30">
            <div className="flex items-center gap-2 text-sm">
              <i className="fas fa-map-marker-alt text-primary"></i>
              {value ? (
                <span>
                  {(value as { lat: number; lng: number }).lat.toFixed(5)},{" "}
                  {(value as { lat: number; lng: number }).lng.toFixed(5)}
                </span>
              ) : (
                <span className="text-muted-foreground">GPS coordinates will be captured</span>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {renderFields()}

      {/* Show tasks that will be created */}
      {formState.tasksToCreate.length > 0 && (
        <Card className="mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <i className="fas fa-tasks text-amber-600"></i>
              Tasks to be created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {formState.tasksToCreate.map((task, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <i className="fas fa-check-circle text-amber-600 mt-0.5"></i>
                  <span>{task.title}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!readOnly && (
        <div className="flex gap-3 mt-6">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Submitting...
              </>
            ) : (
              submitLabel
            )}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </form>
  );
}

// Export a read-only version for viewing submitted forms
export function DynamicFormReadOnly({
  schema,
  values,
}: {
  schema: FormSchema;
  values: Record<string, unknown>;
}) {
  const renderValue = (field: FormFieldDefinition, value: unknown): React.ReactNode => {
    if (value === undefined || value === null || value === "") {
      return <span className="text-muted-foreground italic">Not provided</span>;
    }

    switch (field.type) {
      case "checkbox":
        return value ? "Yes" : "No";
      case "multiselect":
        const selectedLabels = (value as string[])
          .map((v) => field.options?.find((o) => o.value === v)?.label || v)
          .join(", ");
        return selectedLabels || "None";
      case "select":
      case "radio":
        return field.options?.find((o) => o.value === value)?.label || String(value);
      case "gps":
        const coords = value as { lat: number; lng: number };
        return `${coords.lat?.toFixed(5) ?? '?'}, ${coords.lng?.toFixed(5) ?? '?'}`;
      default:
        return String(value);
    }
  };

  return (
    <div className="space-y-3">
      {schema.fields.map((field) => (
        <div key={field.id} className="flex flex-col">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {field.label}
          </span>
          <span className="text-sm">{renderValue(field, values[field.id])}</span>
        </div>
      ))}
    </div>
  );
}
