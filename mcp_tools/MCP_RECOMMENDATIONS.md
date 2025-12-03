# Recommended MCP Servers for NOVUMFLOW

Based on your project stack (React/Vite, Supabase, Playwright/Python testing), we have downloaded and set up the following MCP servers in the `mcp_tools` directory.

## 1. Supabase MCP
**Location:** `mcp_tools/supabase-mcp`
**Purpose:** Interact directly with your Supabase database (tables, edge functions) using AI.

### Configuration
Add this to your MCP Client configuration (e.g., `claude_desktop_config.json`):

```json
"supabase": {
  "command": "npx",
  "args": ["-y", "@supabase/mcp-server"],
  "env": {
    "SUPABASE_URL": "https://kvtdyttgthbeomyvtmbj.supabase.co",
    "sb_secret_E77eVls2_zPj5Krd5xxnrw_JC3jDmsS": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA1MjIxNSwiZXhwIjoyMDc4NjI4MjE1fQ.sPu18Bb90PKUL_rTDLK6MPvgpS1FfduWq4H0xoNWlA8" 
  }
}
```
*Note: You can find your Service Role Key in the Supabase Dashboard under Project Settings > API.*

## 2. Playwright MCP
**Location:** `mcp_tools/playwright-mcp`
**Purpose:** Run browser automation, scrape pages, and execute your existing E2E tests via AI.

### Setup
1. `cd mcp_tools/playwright-mcp`
2. `npm install`
3. `npm run build`

### Configuration
```json
"playwright": {
  "command": "node",
  "args": ["/absolute/path/to/novumflow/mcp_tools/playwright-mcp/dist/index.js"]
}
```

## 3. Git MCP (Official Reference)
**Location:** `mcp_tools/servers/src/git`
**Purpose:** Manage your repository, view diffs, and commit changes.

### Configuration (using uvx/python)
```json
"git": {
  "command": "uvx",
  "args": ["mcp-server-git", "--repository", "/absolute/path/to/novumflow"]
}
```

## 4. Filesystem MCP (Official Reference)
**Location:** `mcp_tools/servers/src/filesystem`
**Purpose:** Safe access to read/write files in your project.

### Configuration
```json
"filesystem": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/absolute/path/to/novumflow"]
}
```

## 5. PostgreSQL MCP (Alternative to Supabase)
If you prefer direct database access:

```json
"postgres": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://postgres:password@db.kvtdyttgthbeomyvtmbj.supabase.co:5432/postgres"]
}
```

## Next Steps
1. Install the necessary runtime dependencies (Node.js, Python/uv).
2. Configure your MCP client (e.g., Claude Desktop) with the JSON snippets above.
3. Replace `YOUR_SUPABASE_SERVICE_ROLE_KEY` with your actual key.
