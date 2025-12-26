# TypeScript Strict Null Checks Migration Guide

## Overview

TypeScript's `strictNullChecks` has been enabled in `tsconfig.json`. This is a critical safety feature that prevents null/undefined errors at runtime by catching them at compile time.

## What Changed

**Before:**
```json
{
  "strictNullChecks": false  // ❌ Unsafe
}
```

**After:**
```json
{
  "strictNullChecks": true   // ✅ Safe
}
```

## Why This Matters

With `strictNullChecks: false`, TypeScript allowed this unsafe code:

```typescript
// Compiles but crashes at runtime! ❌
function getUserName(user: User) {
  return user.name.toUpperCase(); // Runtime error if user is null
}

getUserName(null); // Crashes!
```

With `strictNullChecks: true`, this is caught at compile time:

```typescript
// Compile error - much safer! ✅
function getUserName(user: User | null) {
  return user.name.toUpperCase(); // ❌ Compile error
}
```

## Common Errors and Fixes

### 1. Object is possibly 'null' or 'undefined'

**Error:**
```typescript
const name = user.displayName; // ❌ Object is possibly 'undefined'
```

**Fix Options:**

**Option A: Optional Chaining (Recommended)**
```typescript
const name = user?.displayName; // ✅ Returns undefined if user is null
```

**Option B: Null Check**
```typescript
const name = user !== null ? user.displayName : 'Unknown'; // ✅
```

**Option C: Non-null Assertion (Use Sparingly)**
```typescript
const name = user!.displayName; // ⚠️ Only if you're 100% sure it's not null
```

### 2. Array access is possibly 'undefined'

**Error:**
```typescript
const firstItem = items[0].name; // ❌ possibly undefined
```

**Fix:**
```typescript
const firstItem = items[0]?.name; // ✅
// or
const firstItem = items.length > 0 ? items[0].name : 'Default'; // ✅
```

### 3. Function return type includes undefined

**Error:**
```typescript
function findUser(id: string): User {
  return users.find(u => u.id === id); // ❌ possibly undefined
}
```

**Fix Option A: Update return type**
```typescript
function findUser(id: string): User | undefined {
  return users.find(u => u.id === id); // ✅
}
```

**Fix Option B: Throw if not found**
```typescript
function findUser(id: string): User {
  const user = users.find(u => u.id === id);
  if (!user) throw new Error(`User ${id} not found`);
  return user; // ✅
}
```

### 4. Property access on possibly undefined object

**Error:**
```typescript
const email = response.value[0].fields.Email; // ❌ Multiple possibly undefined
```

**Fix:**
```typescript
const email = response.value?.[0]?.fields?.Email ?? 'unknown@example.com'; // ✅
```

### 5. Callback parameters

**Error:**
```typescript
items.forEach(item => {
  console.log(item.name.toUpperCase()); // ❌ item.name possibly undefined
});
```

**Fix:**
```typescript
items.forEach(item => {
  const name = item.name ?? 'Unknown';
  console.log(name.toUpperCase()); // ✅
});
```

## Compilation Steps

After enabling strict null checks, you'll likely see compilation errors:

```bash
cd EOC-Extensions
npm run build
```

Expected output:
```
src/extensions/notifyToTeamsGroup/NotifyToTeamsGroupCommandSet.ts:XX:XX - error TS2532:
Object is possibly 'undefined'.
```

## Migration Strategy

### Phase 1: Fix Critical Paths (Week 1)
1. Run build to see all errors
2. Fix errors in main extension file first
3. Focus on user-facing functionality

### Phase 2: Fix Remaining Errors (Week 2)
1. Address utility functions
2. Update type definitions
3. Add proper null checks

### Phase 3: Refine (Week 3)
1. Remove unnecessary non-null assertions (!)
2. Improve error messages
3. Add JSDoc comments for nullable parameters

## File-by-File Checklist

- [ ] `src/extensions/notifyToTeamsGroup/NotifyToTeamsGroupCommandSet.ts`
- [ ] `src/extensions/notifyToTeamsGroup/loc/en-us.js`
- [ ] `src/extensions/notifyToTeamsGroup/loc/myStrings.d.ts`
- [ ] `src/index.ts`

## Best Practices

### DO ✅

```typescript
// Use optional chaining
const name = user?.profile?.displayName ?? 'Guest';

// Check before accessing
if (user && user.email) {
  sendEmail(user.email);
}

// Use nullish coalescing
const port = process.env.PORT ?? 3000;

// Proper typing
function getUser(id: string): User | null {
  // ...
}
```

### DON'T ❌

```typescript
// Avoid non-null assertions without checks
const name = user!.name; // Dangerous!

// Don't use 'any' to bypass
const data: any = response; // Defeats the purpose

// Don't disable for whole file
// @ts-ignore everywhere

// Don't cast unnecessarily
const user = response as User; // Might be null!
```

## Useful TypeScript Operators

### Optional Chaining (`?.`)
```typescript
obj?.prop?.method?.(); // Stops if any part is null/undefined
```

### Nullish Coalescing (`??`)
```typescript
const value = input ?? defaultValue; // Only uses default if input is null/undefined
```

### Non-null Assertion (`!`)
```typescript
const value = maybeNull!; // ⚠️ "Trust me, it's not null"
```

### Type Guards
```typescript
if (typeof value === 'string') {
  value.toUpperCase(); // TypeScript knows it's a string here
}

if (value !== null && value !== undefined) {
  value.toString(); // TypeScript knows it's defined here
}
```

## Testing After Migration

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Test in SharePoint:**
   - Deploy to test site
   - Test notify functionality
   - Verify no runtime errors

3. **Check browser console:**
   - No "Cannot read property of undefined" errors
   - All features working as expected

## Rollback Plan

If critical issues arise:

```bash
# Temporarily revert
git checkout HEAD -- tsconfig.json
npm run build
```

## Resources

- [TypeScript Handbook: Null Checks](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Optional Chaining](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#optional-chaining)
- [Nullish Coalescing](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#nullish-coalescing)

---

**Status**: ⚠️ Compilation errors expected - fix them one by one
**Estimated Effort**: 2-4 hours for initial fixes, 1-2 days for thorough cleanup
**Priority**: High - prevents runtime crashes
