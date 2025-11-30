# NovumFlow & CareFlow Development Setup Guide

## ✅ Installed Tools

### 1. **Deno** (v2.5.6)
- **Purpose**: Runtime for Supabase Edge Functions
- **Verification**: `deno --version`
- **Documentation**: https://deno.land/

## 📦 Required VS Code Extensions

Open the workspace file `novumflow.code-workspace` in VS Code to get the recommended extensions.

### Core Extensions (Must Have)

#### 1. **Deno for VS Code** (`denoland.vscode-deno`)
- **Purpose**: Deno language support for Supabase Edge Functions
- **Install**: `code --install-extension denoland.vscode-deno`
- **Why**: Eliminates TypeScript errors in `/supabase/functions/` directory

#### 2. **Supabase** (`supabase.supabase-vscode`)
- **Purpose**: Official Supabase VS Code extension
- **Features**:
  - SQL snippets and autocomplete
  - Function templates
  - Database schema viewer
- **Install**: `code --install-extension supabase.supabase-vscode`

#### 3. **ESLint** (`dbaeumer.vscode-eslint`)
- **Purpose**: JavaScript/TypeScript linting
- **Install**: `code --install-extension dbaeumer.vscode-eslint`

#### 4. **Prettier** (`esbenp.prettier-vscode`)
- **Purpose**: Code formatting
- **Install**: `code --install-extension esbenp.prettier-vscode`

#### 5. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
- **Purpose**: Autocomplete for Tailwind CSS classes
- **Install**: `code --install-extension bradlc.vscode-tailwindcss`

### Productivity Extensions (Recommended)

#### 6. **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`)
- **Purpose**: React code snippets
- **Install**: `code --install-extension dsznajder.es7-react-js-snippets`

#### 7. **Pretty TypeScript Errors** (`yoavbls.pretty-ts-errors`)
- **Purpose**: Makes TypeScript errors more readable
- **Install**: `code --install-extension yoavbls.pretty-ts-errors`

#### 8. **Error Lens** (`usernamehw.errorlens`)
- **Purpose**: Highlights errors inline in the editor
- **Install**: `code --install-extension usernamehw.errorlens`

#### 9. **GitLens** (`eamodio.gitlens`)
- **Purpose**: Enhanced Git capabilities
- **Install**: `code --install-extension eamodio.gitlens`

#### 10. **Material Icon Theme** (`pkief.material-icon-theme`)
- **Purpose**: Better file icons
- **Install**: `code --install-extension pkief.material-icon-theme`

#### 11. **Path Intellisense** (`christian-kohler.path-intellisense`)
- **Purpose**: Autocomplete for file paths
- **Install**: `code --install-extension christian-kohler.path-intellisense`

### Database Extensions

#### 12. **SQLTools** (`mtxr.sqltools`)
- **Purpose**: Database management and SQL queries
- **Install**: `code --install-extension mtxr.sqltools`

#### 13. **SQLTools PostgreSQL Driver** (`mtxr.sqltools-driver-pg`)
- **Purpose**: PostgreSQL support for SQLTools
- **Install**: `code --install-extension mtxr.sqltools-driver-pg`

## 🚀 Quick Install All Extensions

Run this command in your terminal:

```bash
code --install-extension denoland.vscode-deno \
--install-extension supabase.supabase-vscode \
--install-extension dbaeumer.vscode-eslint \
--install-extension esbenp.prettier-vscode \
--install-extension bradlc.vscode-tailwindcss \
--install-extension dsznajder.es7-react-js-snippets \
--install-extension yoavbls.pretty-ts-errors \
--install-extension usernamehw.errorlens \
--install-extension eamodio.gitlens \
--install-extension pkief.material-icon-theme \
--install-extension christian-kohler.path-intellisense \
--install-extension mtxr.sqltools \
--install-extension mtxr.sqltools-driver-pg \
--install-extension msjsdiag.vscode-react-native \
--install-extension graphql.vscode-graphql \
--install-extension irongeek.vscode-env \
--install-extension streetsidesoftware.code-spell-checker
```

## 🛠️ Additional Tools Needed

### 1. **Supabase CLI**
```bash
brew install supabase/tap/supabase
```

### 2. **Node.js & npm** (Already installed)
- Current version: Check with `node --version`
- Required: Node 18+ for Vite and React

### 3. **PostgreSQL Client** (Optional but recommended)
```bash
brew install postgresql@15
```

### 4. **Android Studio** (For mobile development)
- Download from: https://developer.android.com/studio
- Required for building Capacitor Android apps

## 📁 Project Structure

```
hr-recruitment-platform/
├── src/                          # React frontend source
│   ├── components/              # Reusable UI components
│   ├── contexts/                # React contexts (Auth, etc.)
│   ├── hooks/                   # Custom React hooks
│   ├── pages/                   # Page components
│   ├── lib/                     # Utility functions
│   └── types/                   # TypeScript types
├── supabase/
│   ├── functions/               # Edge Functions (Deno)
│   │   ├── automation-engine/
│   │   ├── employee-crud/
│   │   ├── integration-manager/
│   │   └── ...
│   └── migrations/              # SQL migrations
├── public/                      # Static assets
├── migrations/                  # Additional SQL migrations
└── android/                     # Capacitor Android project
```

## 🔧 VS Code Workspace Setup

1. **Open the workspace file**:
   ```bash
   code novumflow.code-workspace
   ```

2. **Trust the workspace** when prompted

3. **Install recommended extensions** when prompted

4. **Reload VS Code** to activate all extensions

## 🎯 Configuration Files

### Deno Configuration
- `supabase/functions/deno.json` - Deno runtime settings
- `supabase/functions/import_map.json` - Module import mappings
- `supabase/functions/settings.json` - VS Code Deno settings

### TypeScript Configuration
- `tsconfig.json` - Base TypeScript config
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.node.json` - Node.js TypeScript config

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

For Supabase Edge Functions, set these in Supabase Dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SENDGRID_API_KEY`
- `SLACK_BOT_TOKEN`
- `ZOOM_ACCESS_TOKEN`

## 🧪 Testing the Setup

### 1. Test Deno Installation
```bash
cd supabase/functions/automation-engine
deno run --allow-net index.ts
```

### 2. Test Frontend Build
```bash
npm run dev
```

### 3. Test Supabase Functions Locally
```bash
supabase functions serve
```

## 📚 Documentation Links

- **NovumFlow Docs**: `/docs` directory
- **Supabase Docs**: https://supabase.com/docs
- **Deno Manual**: https://deno.land/manual
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com

## 🐛 Troubleshooting

### Deno TypeScript Errors in Edge Functions
- **Solution**: Make sure Deno extension is enabled for `supabase/functions` directory
- Check `settings.json` in VS Code has `"deno.enablePaths": ["supabase/functions"]`

### Module Not Found Errors
- **Solution**: Run `npm install` in project root
- For Deno: Modules are fetched on first run

### Supabase Connection Issues
- **Solution**: Verify `.env` file has correct Supabase credentials
- Check Supabase project is running

## 🎓 Learning Resources

### For Beginners
1. Start with React fundamentals: https://react.dev/learn
2. Learn TypeScript: https://www.typescriptlang.org/docs/
3. Understand Supabase basics: https://supabase.com/docs/guides/getting-started

### For Intermediate Developers
1. Edge Functions guide: https://supabase.com/docs/guides/functions
2. React patterns: https://patterns.dev/
3. Deno by Example: https://examples.deno.land/

## 📞 Support

If you encounter issues:
1. Check the error in VS Code Problems panel
2. Review the TypeScript errors with Error Lens extension
3. Check Supabase function logs in Supabase Dashboard
4. Review migration files in `/migrations` directory

---

**Last Updated**: 2025-11-26
**Deno Version**: 2.5.6
**Node Version**: (Check with `node --version`)
**Project**: NovumFlow & CareFlow HR Management Platform
