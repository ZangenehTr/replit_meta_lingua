# Dynamic Form Migration Guide

## Overview
This guide documents the proven pattern for migrating hard-coded forms to the Meta Lingua dynamic form system. The pattern was validated through the successful migration of the Forgot Password form (October 30, 2025).

## Prerequisites
- Form Management System fully deployed (form_definitions & form_submissions tables)
- DynamicForm component available (client/src/components/forms/DynamicForm.tsx)
- Public form API endpoint configured (/api/forms/:id)

## Migration Pattern (6 Steps)

### Step 0: Check Existing Form Definitions (CHECK-FIRST PROTOCOL) ⚠️
**CRITICAL**: Before creating any new form, check if it already exists to avoid duplication.

```bash
# List all existing forms
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/forms | jq '.[] | {id, title, category}'

# Check for specific form by category
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/admin/forms?category=Authentication" | jq '.'
```

**Actions**:
1. ✅ Search existing forms by category/title
2. ✅ If form exists, note its ID and skip to Step 3
3. ✅ If form doesn't exist, proceed to Step 2
4. ❌ NEVER create duplicate form definitions

### Step 1: Analyze Current Form
Document the existing form's structure:
- Form fields (name, type, validation rules)
- Multi-language labels and placeholders
- Submission endpoint and payload structure
- Custom styling requirements
- Success/error handling logic

**Example (Forgot Password)**:
```typescript
// Original form
const form = useForm({
  resolver: zodResolver(z.object({
    email: z.string().email("Invalid email address"),
  })),
});

// Submission endpoint: POST /api/auth/forgot-password
// Payload: { email: string }
```

### Step 2: Create Form Definition (ONLY if not found in Step 0)
⚠️ **Only execute this step if Step 0 confirmed the form doesn't exist**

Create the form via the Form Management admin UI or API:

```bash
curl -X POST http://localhost:5000/api/admin/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Form Title",
    "titleEn": "Form Title",
    "titleFa": "عنوان فرم",
    "titleAr": "عنوان النموذج",
    "category": "Category Name",
    "description": "Description",
    "descriptionEn": "Description",
    "descriptionFa": "توضیحات",
    "descriptionAr": "الوصف",
    "fields": [
      {
        "id": "field_name",
        "type": "email|text|phone|number|textarea|select|radio|checkbox|date",
        "label": "Field Label",
        "labelEn": "Field Label",
        "labelFa": "برچسب فیلد",
        "labelAr": "تسمية الحقل",
        "placeholder": "Placeholder",
        "placeholderEn": "Placeholder",
        "placeholderFa": "متن پیش‌نمایش",
        "placeholderAr": "نص العنصر النائب",
        "validation": {
          "required": true,
          "minLength": 3,
          "maxLength": 100,
          "pattern": "regex pattern",
          "customMessage": "Custom error message"
        },
        "order": 1
      }
    ],
    "isActive": true,
    "submitButtonTextEn": "Submit",
    "submitButtonTextFa": "ارسال",
    "submitButtonTextAr": "إرسال"
  }'
```

Note the returned form ID for use in Step 3.

### Step 3: Update Page Component
Refactor the page to use DynamicForm:

```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DynamicForm from "@/components/forms/DynamicForm";

const FORM_ID = 1; // Replace with your form ID

export default function YourPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Fetch form definition
  const { data: formDefinition, isLoading: formLoading } = useQuery({
    queryKey: ['/api/forms', FORM_ID],
  });

  // Preserve original submission logic
  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/your-original-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || "Success!");
      } else {
        setError(result.message || "Failed");
      }
    } catch (error) {
      setError("Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {formLoading ? (
        <div>Loading form...</div>
      ) : formDefinition ? (
        <DynamicForm 
          formDefinition={formDefinition}
          onSubmit={handleSubmit}
          disabled={isLoading}
          showTitle={true}
        />
      ) : (
        <div>Error loading form</div>
      )}
      
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### Step 4: Preserve Custom Styling
Use Tailwind's arbitrary variant selector to apply custom styles to DynamicForm:

```typescript
<div className="
  [&_input]:bg-white/10 
  [&_input]:border-white/20 
  [&_input]:text-white 
  [&_label]:text-white/90 
  [&_button[type=submit]]:bg-gradient-to-r 
  [&_button[type=submit]]:from-purple-500 
  [&_button[type=submit]]:to-pink-500
">
  <DynamicForm {...props} />
</div>
```

**Alternative**: Pass `className` prop to DynamicForm if styling needs to be more targeted.

### Step 5: Test & Verify
Verify the migrated form:
- ✅ Form loads without errors
- ✅ Multi-language labels display correctly
- ✅ Validation works (required fields, format validation)
- ✅ Custom styling preserved
- ✅ Submission endpoint receives correct payload
- ✅ Success/error handling works
- ✅ Form accessible for intended user roles (public/authenticated)

## Common Pitfalls

### 1. Missing Multi-Language Fields
**Problem**: DynamicForm can't display translations if form definition lacks multi-language fields.

**Solution**: Ensure the public form API endpoint returns all multi-language fields:
```typescript
// In server/routes.ts
res.json({
  id: form.id,
  title: form.title,
  titleEn: form.titleEn,
  titleFa: form.titleFa,
  titleAr: form.titleAr,
  description: form.description,
  descriptionEn: form.descriptionEn,
  descriptionFa: form.descriptionFa,
  descriptionAr: form.descriptionAr,
  // ... other fields
  submitButtonTextEn: form.submitButtonTextEn,
  submitButtonTextFa: form.submitButtonTextFa,
  submitButtonTextAr: form.submitButtonTextAr
});
```

### 2. Import Statement Error
**Problem**: `Module has no exported member 'DynamicForm'`

**Solution**: Use default import, not named import:
```typescript
// ✅ Correct
import DynamicForm from "@/components/forms/DynamicForm";

// ❌ Wrong
import { DynamicForm } from "@/components/forms/DynamicForm";
```

### 3. Validation Not Working
**Problem**: Form submits without validating required fields.

**Solution**: Ensure validation rules are properly defined in form definition:
```json
{
  "validation": {
    "required": true,
    "minLength": 3,
    "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
  }
}
```

### 4. Submission Payload Mismatch
**Problem**: Backend expects different field names.

**Solution**: Transform the data in `handleSubmit` before sending:
```typescript
const handleSubmit = async (data: any) => {
  // Transform field names if needed
  const payload = {
    emailAddress: data.email, // Map 'email' field to 'emailAddress'
    // ... other transformations
  };
  
  const response = await fetch("/api/endpoint", {
    body: JSON.stringify(payload)
  });
};
```

## Forms Identified for Migration

### Authentication Forms
1. ✅ **Forgot Password** (MIGRATED - Form ID: 1)
2. Login
3. Register
4. Reset Password (with token)
5. Change Password

### Admin Forms
6. Add Student
7. Add Teacher
8. Create Course
9. Schedule Class
10. Add Payment Method

### Student Forms
11. Course Enrollment
12. Profile Update
13. Change Avatar
14. Feedback Submission

### Call Center Forms
15. Lead Capture
16. Follow-up Notes
17. Schedule Trial Class

### Front Desk Forms
18. Walk-in Intake
19. Guest Registration
20. Trial Class Booking

### Other Forms
21. Contact Us
22. Bug Report
23. Feature Request

## Migration Checklist Template

```markdown
## Form: [Form Name]

- [ ] Step 0: CHECK-FIRST PROTOCOL ⚠️
  - Searched existing forms by category
  - Confirmed form doesn't already exist
  - OR found existing form ID: ___
- [ ] Step 1: Analyzed form structure
  - Fields documented
  - Validation rules documented
  - Submission endpoint documented
- [ ] Step 2: Created form definition in database
  - Form ID: ___
  - Multi-language labels added
  - Validation rules configured
- [ ] Step 3: Updated page component
  - Replaced useForm with DynamicForm
  - Preserved submission logic
  - Added loading state handling
- [ ] Step 4: Custom styling preserved
  - Original design maintained
  - RTL support verified
- [ ] Step 5: Testing completed
  - Form loads correctly
  - Validation works
  - Submission succeeds
  - Multi-language verified
  - No regressions
```

## Best Practices

1. **⚠️ ALWAYS CHECK-FIRST** - Before creating any form, check existing definitions to avoid duplication (CRITICAL)
2. **No duplicate code/data** - Reuse existing form definitions whenever possible
3. **Preserve original submission endpoints** - Don't change backend API routes during migration
4. **Keep custom styling** - Use Tailwind arbitrary variants to maintain brand consistency
5. **Test in all languages** - Verify English, Farsi, and Arabic translations
6. **Maintain backward compatibility** - Ensure migrated forms work identically to originals
7. **Document form IDs** - Keep a central registry of form IDs and their purposes
8. **Handle edge cases** - Empty states, error states, loading states
9. **Test with real data** - NO mock data, NO fake data, always use real API calls and working e2e business logic

## Quick Reference: Retrieving Form IDs

Before migrating any form, retrieve existing definitions:

```bash
# Get all forms
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/forms

# Filter by category
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/admin/forms?category=Authentication"

# Get specific form by ID
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/forms/1

# Check if specific form exists (returns 404 if not found)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/forms/999
```

**Form ID Registry** (updated Oct 30, 2025):

**Authentication Forms:**
- ID 1: Forgot Password ✅ **MIGRATED** (client/src/pages/forgot-password.tsx)
- ID 2: Login - Created, migration deferred (requires password visibility toggle)
- ID 3: Register - Created, migration deferred (requires password visibility toggle)
- ID 4: Reset Password - Created, migration deferred (requires password visibility toggle)

**User Forms:**
- ID 5: User Profile Update - Created, pending migration

**Supervisor Forms:**
- ID 6: Target Setting - Created, pending migration
- ID 16: Class Observation - Created, pending migration

**Admin Forms:**
- ID 7: Communication Log - Created, pending migration
- ID 10: Course Creation - Created, pending migration
- ID 11: Video Lesson - Created, pending migration
- ID 15: Video Course - Created, pending migration
- ID 17: Teacher Management - Created, pending migration
- ID 18: Lead Management - Created, pending migration

**Teacher Forms:**
- ID 8: Teacher Availability - Created, pending migration
- ID 9: Assignment Creation - Created, pending migration

**Call Center Forms:**
- ID 12: New Lead Intake - Created, pending migration

**Front Desk Forms:**
- ID 13: SMS Template - Created, pending migration
- ID 14: Call Logging - Created, pending migration

**TOTAL CREATED: 18 form definitions** (1 migrated, 17 pending migration)

---

## Deferred Forms (Require DynamicForm Enhancements)

The following forms cannot be migrated using the current DynamicForm component and require enhancements:

### 1. **Observation Questionnaire** (Supervisor)
**Reason:** Requires nested array support
- Schema includes `questions` array with complex objects (id, text, type, options, required)
- Current DynamicForm doesn't support array fields or nested object structures
- **Enhancement needed:** Array field type with dynamic row addition/removal

### 2. **Walk-in Intake** (Front Desk)
**Reason:** Multi-step form with complex workflow
- Multi-step wizard interface with validation per step
- Complex state management across steps
- **Enhancement needed:** Multi-step form support in DynamicForm

### 3. **Learning Profile** (User)
**Reason:** Requires array and checkbox group support
- Multiple array fields: targetLanguages[], learningGoals[], motivationFactors[], learningChallenges[], strengths[], interests[]
- Checkbox groups for multi-select options
- **Enhancement needed:** Array field type, checkbox group field type

### 4. **Checkout/Payment** (Student)
**Reason:** Payment processing and sensitive data handling
- Payment gateway integration (Stripe/Shetab)
- Sensitive financial data
- Complex validation and security requirements
- **Enhancement needed:** Secure payment field handling, PCI compliance considerations

## Support & Troubleshooting

For migration issues:
1. Check browser console for errors
2. Verify form definition exists and is active
3. Confirm API endpoint returns multi-language fields
4. Test submission endpoint independently
5. Review DynamicForm component props
6. Check network tab for failed API calls

## Next Steps

After completing migrations:
1. Update replit.md with migration count
2. Monitor for regressions in user feedback
3. Consider adding form versioning for future changes
4. Document any custom patterns discovered during migration
5. Create automated tests for critical forms

---
**Last Updated**: October 30, 2025
**Status**: Pilot migration successful (Forgot Password)
**Remaining**: 22+ forms to migrate
