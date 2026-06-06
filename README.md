# CYBERDESK

CyberDesk is a fullscreen cinematic command-center desktop built with Electron.
It is designed as a local “government hacker OS” style workspace for terminal
work, WSL/Kali commands, notes, database records, app launching,
system monitoring, network review, and controlled self-updates.

## Features
- Fullscreen desktop shell with draggable/resizable windows
- Stable multi-theme compositor with coherent panel, dock, input, and app colors
- Local terminal bridge for WSL, PowerShell, and CMD
- Local login with account creation, admin/user roles, and password lockout
- Local Intel Database with terminal commands such as `db add`, `db search`, `db show`
- Operator logbook, matrix search, local database, and app launcher
- System monitor with CPU/RAM gauges, history charts, memory details, and process review
- Auto-lock after inactivity with configurable timeout
- Security Sweep panel for quick local status assessment
- Electron Builder Windows installer with optional Desktop and Start Menu shortcuts
- Auto-update metadata for release hosting

## Run from terminal
```powershell
cd D:\Programmi\Cyberdesk
npm.cmd start
```

PowerShell may block `npm.ps1` on this machine, so `npm.cmd` is the safer command.

## Local database commands
Use these inside the CyberDesk terminal:

```text
db add Title | tag1, tag2 | content to save
db search keyword
db list
db show record_id
db delete record_id
db clear
```

## Local accounts
CyberDesk creates the first login as an admin account after the boot screen.
Open `Accounts` from the dock or `Open Account Admin` from the system menu to
view, edit, disable, delete, or reset local users.

The account database path is shown inside Account Admin. On Windows it is
normally:

```text
%APPDATA%\CyberDesk\cyberdesk-auth.json
```

Passwords are not stored in plain text. CyberDesk stores salted `scrypt` hashes,
uses timing-safe comparison, locks accounts after repeated failed attempts, and
keeps at least one active admin protected.

## Build and publish updates
```powershell
npm.cmd run build
```

The build creates:
- `dist\CyberDesk-Setup-2.0.0.exe`
- `dist\CyberDesk-Setup-2.0.0.exe.blockmap`
- `dist\latest.yml`

Upload those three files to the update feed URL. Before each public update, bump the `version` in `package.json`, rebuild, and publish the new files to the same URL.

## GitHub release checklist
1. Commit the updated source files.
2. Run `npm.cmd run build`.
3. Upload these files to the GitHub Release or update host:
   - `dist\CyberDesk-Setup-2.0.0.exe`
   - `dist\CyberDesk-Setup-2.0.0.exe.blockmap`
   - `dist\latest.yml`
4. Keep `version: 2.0.0` for this release. Bump it for future public releases.

## Latest polish
- Reworked theme surfaces so red, aqua, purple, green, and minimal themes do not visually overlap.
- Removed the Signal Map/IP wall module to keep CyberDesk lighter and more app-like.
- Added CPU/RAM ring gauges, history bars, RAM used/free details, and process memory bars.
- Simplified the desktop compositor to one quiet grid layer to avoid overlapping graphics.
- Fixed responsive overflow in topbar, dock, monitor, process and system detail panels.
- Replaced the app/setup logo with a new government cyber operations seal and regenerated Windows icons.
- Added installer choices for Desktop and Start Menu shortcuts.
- Added local account login, first-run admin creation, and Account Admin user management.
- Added configurable auto-lock and a lock transition.
- Added Security Sweep in the overview/control room.
- Removed the problematic launch overlay that could leave rectangular color artifacts.
- Preserved the lighter compositor profile for older PCs.
