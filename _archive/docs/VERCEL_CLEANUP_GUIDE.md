# Final Deployment & Cleanup Guide

## 1. Confirming the New Architecture
We have successfully consolidated the Vercel projects to use clear, professional names.

| Application | New Production URL | Old / Backup URL (To Delete) |
|-------------|-------------------|------------------------------|
| **NovumFlow (HR)** | `https://hr-recruitment-platform.vercel.app` | `bgffggjfgcfnjgcj.vercel.app` |
| **CareFlow** | `https://careflow-ai.vercel.app` | `careflow-mu.vercel.app` |

---

## 2. Connect Git Repository (Action Required)
Since the new projects were created via CLI, you must manually link them to your GitHub repository to enable automatic deployments on push.

### For `hr-recruitment-platform`:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Select the **hr-recruitment-platform** project.
3. Go to **Settings** > **Git**.
4. Click **Connect Git Repository**.
5. Select **djval79/novumflow1**.
6. **IMPORTANT**: In the "Root Directory" section, click Edit and select `hr-recruitment-platform`.
7. Click **Save**.

### For `careflow-ai`:
1. Select the **careflow-ai** project.
2. Go to **Settings** > **Git**.
3. Click **Connect Git Repository**.
4. Select **djval79/novumflow1**.
5. **IMPORTANT**: In the "Root Directory" section, click Edit and select `careflow-ai`.
6. Click **Save**.

---

## 3. Configure Environment Variables
Ensure both projects have the correct environment variables in Vercel **Settings** > **Environment Variables**.

**Shared Variables (Both Projects):**
- `VITE_SUPABASE_URL`: `https://niikshfoecitimepiifo.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: (Your Public Anon Key)

**NovumFlow Specific:**
- `VITE_CAREFLOW_URL`: `https://careflow-ai.vercel.app`

**CareFlow Specific:**
- `VITE_NOVUMFLOW_URL`: `https://hr-recruitment-platform.vercel.app`

---

## 4. Cleanup Old Projects
Once you have verified the new URLs are working:
1. Go to the **Settings** > **General** of `bgffggjfgcfnjgcj`.
2. Scroll to bottom and click **Delete Project**.
3. Repeat for `careflow-mu`.

This will leave you with a clean, professional project list.
