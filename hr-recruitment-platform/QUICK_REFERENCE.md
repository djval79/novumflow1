# 🚀 NovumFlow Quick Reference Card

## Essential Commands

### Development Server
```bash
npm run dev              # Start frontend (http://localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build
```

### Supabase Edge Functions
```bash
supabase functions serve                    # Serve all functions locally
supabase functions deploy automation-engine # Deploy specific function
supabase functions logs automation-engine   # View function logs
```

### Database Migrations
```bash
supabase migration new add_feature   # Create new migration
supabase db reset                     # Reset local database
supabase db push                      # Push migrations to remote
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript types (if configured)
```

### Deno (Edge Functions)
```bash
deno --version                        # Check Deno version
deno cache supabase/functions/**/*.ts # Cache remote dependencies
deno fmt supabase/functions/          # Format code
deno lint supabase/functions/         # Lint code
```

## VS Code Shortcuts

| Action | Shortcut (Mac) | Shortcut (Windows/Linux) |
|--------|----------------|--------------------------|
| Quick Open File | `⌘P` | `Ctrl+P` |
| Command Palette | `⌘⇧P` | `Ctrl+Shift+P` |
| Format Document | `⌥⇧F` | `Alt+Shift+F` |
| Go to Definition | `F12` | `F12` |
| Show Problems | `⌘⇧M` | `Ctrl+Shift+M` |
| Toggle Terminal | `` ⌃` `` | `` Ctrl+` `` |
| Multi-cursor Edit | `⌥⌘↓` | `Alt+Ctrl+Down` |

## Project Directories

| Directory | Purpose |
|-----------|---------|
| `src/` | React frontend source code |
| `src/components/` | Reusable UI components |
| `src/pages/` | Page components |
| `src/contexts/` | React contexts (Auth, etc.) |
| `src/hooks/` | Custom React hooks |
| `supabase/functions/` | Edge Functions (Deno runtime) |
| `migrations/` | SQL database migrations |
| `public/` | Static assets |

## Environment Variables

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Edge Functions (Supabase Dashboard)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SENDGRID_API_KEY
SLACK_BOT_TOKEN
ZOOM_ACCESS_TOKEN
```

## Useful File Paths

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite configuration |
| `tailwind.config.js` | Tailwind CSS config |
| `tsconfig.json` | TypeScript config |
| `package.json` | Dependencies & scripts |
| `supabase/functions/deno.json` | Deno configuration |

## Common Tasks

### Add New Edge Function
```bash
# Create function directory
mkdir -p supabase/functions/my-function

# Create index.ts
cat > supabase/functions/my-function/index.ts << 'EOF'
declare const Deno: any;

Deno.serve(async (req: Request) => {
  return new Response(JSON.stringify({ message: "Hello" }), {
    headers: { "Content-Type": "application/json" }
  });
});
EOF

# Test locally
supabase functions serve my-function

# Deploy
supabase functions deploy my-function
```

### Add New React Page
```bash
# Create page component
touch src/pages/MyNewPage.tsx

# Add route in src/App.tsx
# Import: import MyNewPage from './pages/MyNewPage';
# Add Route: <Route path="/my-new-page" element={<MyNewPage />} />
```

### Create Database Migration
```bash
# Create migration file
supabase migration new my_changes

# Edit: migrations/YYYYMMDDHHMMSS_my_changes.sql
# Apply: supabase db reset (local) or supabase db push (remote)
```

## Debugging

### Frontend Issues
1. Check browser console (F12)
2. Check VS Code Problems panel (⌘⇧M)
3. Check Vite terminal output
4. Clear cache: `rm -rf node_modules && npm install`

### Edge Function Issues
1. Check Supabase Dashboard → Functions → Logs
2. Test locally: `supabase functions serve function-name`
3. Check Deno types: `deno check supabase/functions/function-name/index.ts`
4. View errors in VS Code with Deno extension enabled

### Database Issues
1. Check Supabase Dashboard → Database → Logs
2. Review migration files in `/migrations`
3. Test query in Supabase SQL Editor
4. Check RLS policies

## Documentation Links

- **Supabase**: https://supabase.com/docs
- **Deno**: https://deno.land/manual
- **React**: https://react.dev
- **Vite**: https://vitejs.dev
- **Tailwind**: https://tailwindcss.com
- **shadcn/ui**: https://ui.shadcn.com

## Support

📖 See `DEVELOPMENT_SETUP.md` for detailed setup instructions  
📋 See `SETUP_COMPLETE.md` for installation summary  
🐛 Check VS Code Problems panel for errors  
💬 Review Supabase Dashboard logs for runtime issues

---

**Quick Start**: `npm run dev` → Open http://localhost:5173 → Start coding! 🚀
