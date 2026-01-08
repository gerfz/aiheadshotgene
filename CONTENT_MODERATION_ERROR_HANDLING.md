# Content Moderation Error Handling

## Problem

When users submitted prompts containing sensitive content (explicit, violent, discriminatory), Replicate would flag them with error code **E005**, but:
- Backend logged the error but didn't pass it to the frontend
- Mobile app showed generic "Generation failed" after 120 seconds
- Users had no idea why their generation failed
- No guidance on what content is allowed

## Solution Implemented

### 1. Backend Detection & Messaging (`backend/src/services/nanoBanana.ts`)

Added specific error detection for Replicate's content moderation:

```typescript
catch (error: any) {
  // Check for content moderation errors (E005 - sensitive content)
  if (error.message && error.message.includes('E005')) {
    throw new Error('CONTENT_POLICY_VIOLATION: Your prompt was flagged by our content filter...');
  }
  
  if (error.message && error.message.includes('flagged as sensitive')) {
    throw new Error('CONTENT_POLICY_VIOLATION: Content detected as sensitive...');
  }
  
  throw new Error(`Image generation failed: ${error.message}`);
}
```

**Error Prefix**: `CONTENT_POLICY_VIOLATION:` allows frontend to detect and show special UI.

### 2. Error Message Propagation (`backend/src/routes/generate.ts`)

Updated the status endpoint to fetch and return error messages:

```typescript
// If generation failed, fetch the error message from generation_jobs table
let errorMessage = null;
if (data.status === 'failed') {
  const { data: jobData } = await supabaseAdmin
    .from('generation_jobs')
    .select('error_message')
    .eq('generation_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (jobData?.error_message) {
    errorMessage = jobData.error_message;
  }
}

// Include in response
const generation = {
  // ... other fields
  errorMessage: errorMessage
};
```

### 3. Frontend Error Handling (`mobile/src/services/api.ts`)

Updated polling to use the error message from the backend:

```typescript
const errorMessage = data.generation?.errorMessage;

if (status === 'failed') {
  const error = errorMessage || 'Generation failed';
  throw new Error(error); // This gets displayed to user
}
```

### 4. Special Error Screen (`mobile/app/generating.tsx`)

Created a dedicated UI for content policy violations:

```typescript
// Detect content policy violations
const isContentViolation = error.includes('CONTENT_POLICY_VIOLATION') 
  || error.includes('flagged as sensitive');

if (isContentViolation) {
  return (
    <ErrorScreen 
      icon="🚫"
      title="Content Not Allowed"
      message="Your prompt contains content that violates our community guidelines..."
      showGuidelines={true}
    />
  );
}
```

## New Error Screen Features

### Visual Design
- **Icon**: 🚫 (stop sign) instead of 😔 (sad face)
- **Title**: "Content Not Allowed" (clear and direct)
- **Message**: Explains the issue in user-friendly language
- **Guidelines Box**: Shows what's allowed and not allowed

### Guidelines Display

**✓ Allowed Content:**
- Professional portraits
- Fashion & lifestyle photos
- Creative & artistic styles
- Family-friendly edits

**✗ Not Allowed:**
- Adult or explicit content
- Violence or gore
- Discriminatory content
- Illegal activities

### Call-to-Action
- Button: "← Try a Different Prompt"
- Encourages users to modify their prompt and try again

## User Experience Flow

### Before Fix:
1. User submits sensitive prompt
2. Backend fails with E005 error
3. User sees loading screen for 120 seconds
4. Shows generic "Generation failed" error
5. User confused and frustrated

### After Fix:
1. User submits sensitive prompt
2. Backend fails with E005 error (within 5-10 seconds)
3. Error message propagated to frontend
4. Special error screen appears immediately
5. User sees clear explanation with guidelines
6. User knows exactly what went wrong and how to fix it

## Error Detection Logic

The system detects content violations if:
- Error message contains `"E005"` (Replicate's code for sensitive content)
- Error message contains `"flagged as sensitive"`
- Error message contains `"CONTENT_POLICY_VIOLATION"` (our prefix)

## Database Flow

```
1. Worker catches Replicate E005 error
   ↓
2. Calls fail_generation_job(job_id, error_message)
   ↓
3. Supabase stores error_message in generation_jobs table
   ↓
4. Frontend polls /api/generate/:id/status
   ↓
5. Backend fetches error_message from generation_jobs
   ↓
6. Returns error_message in response
   ↓
7. Frontend displays special error UI
```

## Testing

### Test Content Violations:

Try prompts like:
- "naked person"
- "violent scene"
- "explicit content"
- Any prompt Replicate flags as sensitive

### Expected Behavior:
1. Generation starts
2. Fails within 5-10 seconds
3. Shows 🚫 icon with "Content Not Allowed" title
4. Displays guidelines box
5. Button says "Try a Different Prompt"

### Test Normal Failures:

Try prompts that fail for other reasons (invalid image, network error, etc.)

### Expected Behavior:
1. Shows 😔 icon with "Generation Failed" title
2. Displays actual error message
3. No guidelines box
4. Button says "Go Back"

## Edge Cases Handled

1. **No error message**: Falls back to "Generation failed"
2. **Multiple retries**: Shows error from the most recent job attempt
3. **Network errors**: Still shows regular error screen
4. **Timeout errors**: Regular error screen (not content violation)

## Styling

### Guidelines Box
- Background: `#1E293B` (dark slate)
- Border: `#334155` (light slate)
- Border radius: `16px`
- Padding: `20px`
- Text: Color-coded (white titles, grey items)

### Button
- Background: `#6366F1` (indigo)
- Shadow: Elevated with glow
- Text: White, bold

## Future Enhancements

Possible improvements:
- [ ] Show specific suggestions based on violated rule
- [ ] Allow users to appeal false positives
- [ ] Track most common violations for better prompts
- [ ] Add example of "good" prompts
- [ ] Link to full community guidelines page
- [ ] Show "Report False Positive" option

## Technical Notes

### Why E005?
Replicate uses error codes to categorize failures:
- **E005**: Content flagged as sensitive
- **E004**: Input validation error
- **E003**: Model error
- etc.

### Why Prefix `CONTENT_POLICY_VIOLATION:`?
- Makes it easy to detect in frontend
- Allows for different types of violations in future
- Clear for debugging logs

### Why Separate Guidelines Box?
- Educational: Teaches users what's acceptable
- Reduces support tickets
- Improves compliance
- Better user trust

## Impact

### Before:
- ❌ Users confused by generic errors
- ❌ No guidance on fixing the issue
- ❌ Long wait times (120s timeout)
- ❌ Support tickets: "Why did my generation fail?"

### After:
- ✅ Clear, immediate feedback
- ✅ Helpful guidelines shown
- ✅ Fast detection (~5-10 seconds)
- ✅ Fewer support tickets
- ✅ Better user education
- ✅ Improved platform compliance

## Conclusion

The new content moderation error handling:
- **Educates** users about acceptable content
- **Reduces** support burden
- **Improves** user experience
- **Protects** the platform from policy violations
- **Clarifies** why generations fail

Users now get instant, actionable feedback instead of mysterious timeouts! 🎉

