# AOVPN — Build & Git Cheatsheet

A step-by-step reference for setting up your dev environment, building the app, and pushing to GitHub.

---

## 🛠️ Part 0: Prerequisites (One-Time Setup)

You need these tools installed before you can build the project. The easiest way on Windows is using **winget** (built into Windows 10/11).

### Required Tools

| Tool | What it's for | Version needed |
|------|--------------|----------------|
| **Visual Studio Build Tools** | C/C++ compiler — Rust needs this to compile native code on Windows | 2022+ |
| **Rust** | Backend language — compiles to the `.exe` | 1.77+ |
| **Node.js** | Frontend tooling — runs Vite, TypeScript, npm | 18+ |
| **Git** | Version control — push/pull code to GitHub | any |
| **WebView2** | Tauri's rendering engine (usually pre-installed on Win 10/11) | any |

### Install Everything

Open **PowerShell as Administrator** and run:

#### 1. Visual Studio Build Tools (IMPORTANT — Rust won't compile without this!)

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

After installing, open **Visual Studio Installer** (search in Start menu) and make sure you have this workload checked:

- ✅ **"Desktop development with C++"**
  - This includes the MSVC compiler, Windows SDK, and CMake — all needed by Rust

> **Why?** Rust compiles to native code but needs a C/C++ linker and Windows SDK. Without this, you'll get `link.exe not found` errors during build.

#### 2. Rust

```powershell
winget install Rustlang.Rustup
```

After install, open a **new** terminal and verify:

```powershell
rustc --version    # should show 1.77+
cargo --version    # Rust's package manager
```

> **Why?** The entire backend (`src-tauri/`) is written in Rust. Cargo manages dependencies and compilation.

#### 3. Node.js

```powershell
winget install OpenJS.NodeJS.LTS
```

Verify in a new terminal:

```powershell
node --version     # should show 18+
npm --version      # Node's package manager
```

> **Why?** The frontend (React + TypeScript) uses npm to install dependencies and Vite to bundle the code.

#### 4. Git

```powershell
winget install Git.Git
```

Configure your identity (once):

```powershell
git config --global user.name "leiqos"
git config --global user.email "leiqos@users.noreply.github.com"
```

#### 5. GitHub CLI (optional but recommended)

```powershell
winget install GitHub.cli
gh auth login      # follow the prompts to authenticate
```

> This makes `git push` work without password prompts.

### Verify Everything Works

```powershell
rustc --version      # Rust compiler
cargo --version      # Rust package manager
node --version       # Node.js runtime
npm --version        # Node package manager
git --version        # Git
```

If all commands return version numbers, you're ready to build!

---

## 🔧 Part 1: Building the App

### What happens during a build?

```
npx tauri build
```

This one command does **two things** in sequence:

| Step | What it does | Output |
|------|-------------|--------|
| **1. Frontend** | Runs `tsc` (TypeScript check) then `vite build` (bundles React + CSS + JS) | `dist/` folder with optimized HTML/CSS/JS |
| **2. Backend** | Compiles all Rust code in release mode, **embeds** the `dist/` files into the binary | `src-tauri/target/release/aovpn.exe` |

The result is a **single `.exe`** with everything inside — no Node.js, no browser, no extra files needed to run it.

### Build times

- **First build:** ~3 minutes (Rust compiles all dependencies)
- **After changes:** ~10-30 seconds (only recompiles what changed)

### Copy to Desktop (optional)

```powershell
Copy-Item "src-tauri\target\release\aovpn.exe" "$HOME\Desktop\AOVPN.exe"
```

---

## 🚀 Part 2: First-Time Push to GitHub (Fresh, No History)

Since you already pushed before and want a **clean start**, do this:

### Step 1: Create the repo on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Name: `aovpn`
3. **Don't** check "Add a README" (we have one)
4. Click **Create repository**

### Step 2: Reset git and push

```powershell
# Go to project folder
cd C:\path\to\aovpn

# Delete old git history
Remove-Item -Recurse -Force .git

# Start fresh
git init                         # creates a new empty git repository
git add .                        # stages ALL files (respects .gitignore)
git commit -m "Initial commit: AOVPN v1.0.0"   # saves the snapshot

# Connect to GitHub and push
git remote add origin https://github.com/leiqos/aovpn.git
git branch -M main               # rename branch to "main"
git push -u origin main           # upload everything to GitHub
```

> **If the repo already exists on GitHub** and has content, you may need to force push:
> ```powershell
> git push -u origin main --force
> ```
> ⚠️ This **overwrites** everything on GitHub with your local version. That's fine for a fresh start.

---

## 📝 Part 3: After Making Changes (Daily Workflow)

Every time you change something and want to update GitHub:

```powershell
# 1. See what changed
git status

# 2. Stage your changes
git add .                        # stages everything
# OR stage specific files:
git add README.md docs/Security.md

# 3. Commit (save a snapshot with a message)
git commit -m "Add screenshots to README"

# 4. Push to GitHub
git push
```

That's it — **status → add → commit → push**. Repeat every time.

### What does each command do?

| Command | Purpose |
|---------|---------|
| `git status` | Shows which files were changed, added, or deleted |
| `git add .` | Marks all changes to be included in the next commit |
| `git add <file>` | Marks only a specific file |
| `git commit -m "message"` | Saves a snapshot of your staged changes with a description |
| `git push` | Uploads your commits to GitHub |

### Write good commit messages

```powershell
# ❌ Bad
git commit -m "update"
git commit -m "fix stuff"

# ✅ Good
git commit -m "Add client and server tab screenshots"
git commit -m "Fix routing table display in diagnostics"
git commit -m "Update README with architecture diagram"
```

---

## 🔄 Part 4: Full Workflow (Change → Build → Push)

Example: you changed some code and want to build + push.

```powershell
# 1. Build the app
npx tauri build

# 2. Test it
Copy-Item "src-tauri\target\release\aovpn.exe" "$HOME\Desktop\AOVPN.exe"
# → double-click AOVPN.exe on Desktop to test

# 3. If it works, commit and push
git add .
git commit -m "Describe what you changed"
git push
```

> **Note:** The `.exe` is NOT pushed to GitHub (the `target/` folder is in `.gitignore`).
> People who clone your repo will build it themselves using `npx tauri build`.

---

## 📸 Quick Reference: Adding Screenshots

```powershell
# 1. Take screenshots (Win + Shift + S) and save them to:
#    docs/screenshots/client-tab.png
#    docs/screenshots/server-tab.png

# 2. Commit and push
git add docs/screenshots/
git commit -m "Add app screenshots"
git push
```

---

## ❓ Common Issues

| Problem | Solution |
|---------|----------|
| `git push` asks for password | Run `gh auth login` (install GitHub CLI first: `winget install GitHub.cli`) |
| `git push` rejected | Run `git pull --rebase` first, then `git push` again |
| Build fails on TypeScript | Run `npx tsc --noEmit` to see the type errors |
| Build fails on Rust | Check the error message — usually a missing `;` or type mismatch |
