# 🚀 Deploy Admin App via CLI (Recommended)

Since Vercel UI isn't showing admin-control-app in the dropdown, use the CLI instead:

## Step 1: Login to Vercel
```bash
vercel login
```

This will open your browser to authenticate.

## Step 2: Deploy from Admin Directory
```bash
cd admin-control-app
vercel --prod
```

## Step 3: Answer the Prompts

When asked:

**"Set up and deploy?"** → `Y` (Yes)

**"Which scope?"** → Select your account (divkotak007)

**"Link to existing project?"** → `N` (No - create new)

**"What's your project's name?"** → Type: `workflows-alpha`

**"In which directory is your code located?"** → `.` (current directory)

That's it! Vercel will:
- Detect Vite automatically
- Build your app
- Deploy to workflows-alpha.vercel.app

## Expected Output

```
🔍  Inspect: https://vercel.com/...
✅  Production: https://workflows-alpha.vercel.app
```

## ✅ After Deployment

Visit: https://workflows-alpha.vercel.app

You should see your admin login screen!

---

## Alternative: Manual Path Entry in UI

If you prefer the UI:

1. On Vercel import page, find the "Root Directory" field
2. **Click directly in the text input** (not dropdown)
3. **Clear it and type**: `admin-control-app`
4. Press Tab or Enter
5. Continue with deployment

The CLI method is more reliable though!
