# Local Development Guide for GKVK Login Portal

## Issue: localhost:4200 Not Loading

### Root Cause
The application is configured for Azure deployment with `/dashboard/` base href, which can interfere with local development.

### Solution Steps

#### 1. Ensure Correct Angular CLI Installation
```bash
# Check if Angular CLI is installed globally
ng version

# If not installed, install it
npm install -g @angular/cli@19

# Or use the local version
npx ng serve
```

#### 2. Run Development Server
```bash
# Option 1: Using npm script
npm start

# Option 2: Using ng serve directly
ng serve

# Option 3: With specific configuration
ng serve --configuration development --open

# Option 4: Specify port explicitly
ng serve --port 4200 --open
```

#### 3. Configure Backend Endpoint for Local Development

**File:** `src/app/shared/endpoints.model.ts`

```typescript
static getbaseURL() {
  // For LOCAL development:
  return 'https://localhost:7024'

  // For REMOTE/Azure deployment (comment out for local):
  // return 'https://gkvk-qaenv.azurewebsites.net';
}
```

**IMPORTANT:** Switch between these URLs based on your environment:
- **Local Dev**: Use `https://localhost:7024` (or your backend port)
- **Azure/Deployment**: Use `https://gkvk-qaenv.azurewebsites.net`

#### 4. Clear Browser Cache
Sometimes cached files interfere with local development:

```bash
# Chrome/Edge:
Press Ctrl + Shift + Delete
Clear "Cached images and files"

# Or hard reload:
Press Ctrl + Shift + R
```

#### 5. Clear Angular Build Cache
```bash
# Delete .angular cache folder
rm -rf .angular

# Delete dist folder
rm -rf dist

# Clear node_modules and reinstall (if still having issues)
rm -rf node_modules
npm install
```

#### 6. Check Console for Errors
Open browser DevTools (F12) and check for:
- **Console errors** - JavaScript/TypeScript errors
- **Network tab** - Failed API calls
- **Application tab** - localStorage issues

---

## Common Issues & Fixes

### Issue A: "Cannot GET /" Error

**Cause:** Routing configuration issue

**Fix:**
```typescript
// src/index.html should have:
<base href="/">  ✅ Correct for local dev

// NOT:
<base href="/dashboard/">  ❌ Only for Azure deployment
```

### Issue B: API Calls Failing (CORS/Connection Refused)

**Cause:** Backend not running or wrong endpoint

**Fix:**
1. Ensure backend is running on `https://localhost:7024`
2. Update `endpoints.model.ts` to point to correct backend
3. Check CORS configuration in backend allows `http://localhost:4200`

### Issue C: White Screen / Blank Page

**Cause:** JavaScript errors or routing issues

**Fix:**
1. Check browser console for errors (F12)
2. Verify all dependencies are installed: `npm install`
3. Clear cache and rebuild: `rm -rf .angular dist && ng serve`

### Issue D: "Module not found" Errors

**Cause:** Missing dependencies

**Fix:**
```bash
# Reinstall dependencies
npm install

# If specific module is missing
npm install <module-name>
```

---

## Development vs Production Configuration

### Development (Local)
```bash
# Run with development configuration
ng serve --configuration development

# Features:
- Source maps enabled
- No optimization
- Fast rebuild
- Hot reload
- Base href: /
```

### Production (Azure Deployment)
```bash
# Build for production
ng build --configuration production --base-href /dashboard/

# Features:
- Minified and optimized
- No source maps (by default)
- Base href: /dashboard/
- Output to dist/ folder
```

---

## Recommended Development Workflow

1. **Start Backend** (if running locally)
   ```bash
   # In your backend project
   dotnet run
   # or
   dotnet watch run
   ```

2. **Configure Endpoint**
   ```typescript
   // src/app/shared/endpoints.model.ts
   return 'https://localhost:7024'  // Local backend
   ```

3. **Start Frontend**
   ```bash
   npm start
   # or
   ng serve --open
   ```

4. **Access Application**
   - URL: `http://localhost:4200`
   - Login page should load automatically
   - Check browser console for any errors

---

## Debugging Tips

### Enable Verbose Logging
```bash
ng serve --verbose
```

### Check Port Availability
```bash
# Check if port 4200 is in use
netstat -ano | findstr :4200  # Windows
lsof -i :4200                 # Linux/Mac

# Use different port if 4200 is busy
ng serve --port 4300
```

### Verify Node/npm Versions
```bash
node --version   # Should be >= 18.x
npm --version    # Should be >= 9.x
ng version       # Should be 19.x
```

---

## Quick Troubleshooting Checklist

- [ ] Backend is running (if using local backend)
- [ ] `endpoints.model.ts` points to correct backend URL
- [ ] `index.html` has `<base href="/">`
- [ ] Browser cache cleared
- [ ] No errors in browser console (F12)
- [ ] Port 4200 is not blocked/in use
- [ ] All npm packages installed (`npm install`)
- [ ] Angular CLI is properly installed

---

## Contact/Support

If localhost:4200 still doesn't load after following these steps:

1. Check browser console errors (F12 → Console tab)
2. Check network tab for failed requests
3. Share error messages for further debugging

---

**Last Updated:** 2025-01-XX
**Angular Version:** 19.2.0
**Node Version:** >= 18.x
