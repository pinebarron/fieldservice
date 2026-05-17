import type { FormLogicRule, FormFieldDefinition, FormSchema } from "@shared/schema";

export interface FormState {
  values: Record<string, unknown>;
  visibleFields: Set<string>;
  requiredFields: Set<string>;
  tasksToCreate: Array<{ title: string; description?: string }>;
}

/**
 * Evaluates a single condition against form values
 */
function evaluateCondition(
  condition: FormLogicRule["condition"],
  values: Record<string, unknown>
): boolean {
  const fieldValue = values[condition.field];
  const targetValue = condition.value;

  switch (condition.operator) {
    case "equals":
      return fieldValue === targetValue;

    case "not_equals":
      return fieldValue !== targetValue;

    case "contains":
      if (typeof fieldValue === "string" && typeof targetValue === "string") {
        return fieldValue.toLowerCase().includes(targetValue.toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(targetValue);
      }
      return false;

    case "greater_than":
      if (typeof fieldValue === "number" && typeof targetValue === "number") {
        return fieldValue > targetValue;
      }
      return false;

    case "less_than":
      if (typeof fieldValue === "number" && typeof targetValue === "number") {
        return fieldValue < targetValue;
      }
      return false;

    case "is_empty":
      return (
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === "" ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      );

    case "is_not_empty":
      return !(
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === "" ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      );

    default:
      return false;
  }
}

/**
 * Processes all logic rules and returns the updated form state
 */
export function evaluateFormLogic(
  schema: FormSchema,
  logicRules: FormLogicRule[],
  values: Record<string, unknown>
): FormState {
  // Start with all fields visible and only schema-required fields required
  const visibleFields = new Set(schema.fields.map((f) => f.id));
  const requiredFields = new Set(
    schema.fields.filter((f) => f.required).map((f) => f.id)
  );
  const tasksToCreate: Array<{ title: string; description?: string }> = [];

  // Process each rule
  for (const rule of logicRules) {
    const conditionMet = evaluateCondition(rule.condition, values);

    if (conditionMet) {
      switch (rule.action.type) {
        case "show":
          visibleFields.add(rule.action.target);
          break;

        case "hide":
          visibleFields.delete(rule.action.target);
          // Also remove from required if hidden
          requiredFields.delete(rule.action.target);
          break;

        case "require":
          requiredFields.add(rule.action.target);
          break;

        case "unrequire":
          requiredFields.delete(rule.action.target);
          break;

        case "create_task":
          if (rule.action.taskDetails) {
            tasksToCreate.push({
              title: rule.action.taskDetails.title,
              description: rule.action.taskDetails.description,
            });
          }
          break;
      }
    }
  }

  return {
    values,
    visibleFields,
    requiredFields,
    tasksToCreate,
  };
}

/**
 * Validates form values against current state
 */
export function validateFormState(
  schema: FormSchema,
  state: FormState
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const field of schema.fields) {
    // Skip hidden fields
    if (!state.visibleFields.has(field.id)) {
      continue;
    }

    const value = state.values[field.id];
    const isRequired = state.requiredFields.has(field.id);

    // Check required
    if (isRequired) {
      const isEmpty =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        errors[field.id] = `${field.label} is required`;
        continue;
      }
    }

    // Skip further validation if empty and not required
    if (value === undefined || value === null || value === "") {
      continue;
    }

    // Type-specific validation
    if (field.validation) {
      if (field.type === "number" && typeof value === "number") {
        if (field.validation.min !== undefined && value < field.validation.min) {
          errors[field.id] = `${field.label} must be at least ${field.validation.min}`;
        }
        if (field.validation.max !== undefined && value > field.validation.max) {
          errors[field.id] = `${field.label} must be at most ${field.validation.max}`;
        }
      }

      if ((field.type === "text" || field.type === "textarea") && typeof value === "string") {
        if (field.validation.minLength !== undefined && value.length < field.validation.minLength) {
          errors[field.id] = `${field.label} must be at least ${field.validation.minLength} characters`;
        }
        if (field.validation.maxLength !== undefined && value.length > field.validation.maxLength) {
          errors[field.id] = `${field.label} must be at most ${field.validation.maxLength} characters`;
        }
        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            errors[field.id] = `${field.label} format is invalid`;
          }
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Gets the fields that should be rendered, filtered by visibility
 */
export function getVisibleFields(
  schema: FormSchema,
  state: FormState
): FormFieldDefinition[] {
  return schema.fields.filter((f) => state.visibleFields.has(f.id));
}

/**
 * Checks if a specific field is required in the current state
 */
export function isFieldRequired(fieldId: string, state: FormState): boolean {
  return state.requiredFields.has(fieldId);
}

/**
 * Creates an initial form state from schema
 */
export function createInitialFormState(
  schema: FormSchema,
  logicRules: FormLogicRule[],
  initialValues: Record<string, unknown> = {}
): FormState {
  return evaluateFormLogic(schema, logicRules, initialValues);
}

/**
 * Updates form state when a value changes
 */
export function updateFormState(
  schema: FormSchema,
  logicRules: FormLogicRule[],
  currentValues: Record<string, unknown>,
  fieldId: string,
  newValue: unknown
): FormState {
  const updatedValues = {
    ...currentValues,
    [fieldId]: newValue,
  };
  return evaluateFormLogic(schema, logicRules, updatedValues);
}
