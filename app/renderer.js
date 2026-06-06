const { ipcRenderer } = require("electron");

/* ===================================================== */
/* CYBERDESK 2.0.0 RENDERER
 *
 * Questo file controlla tutta la UI: finestre, terminale, launcher,
 * impostazioni locali e piccoli effetti visivi. I commenti di sezione
 * sono pensati per aiutarti a modificare una parte alla volta.
 */
/* ===================================================== */
/* ===================================================== */
/* APP STATE: configurazione salvata e dati del desktop */
/* ===================================================== */

const SETTINGS_KEY = "cyberdesk.ethicalOs.settings.v1";
const LOGBOOK_KEY = "cyberdesk.ethicalOs.logbook.v2";
const DATABASE_KEY = "cyberdesk.ethicalOs.database.v1";
const TERMINAL_HISTORY_KEY = "cyberdesk.ethicalOs.terminalHistory.v1";
const CUSTOM_LAYOUTS_KEY = "cyberdesk.ethicalOs.layouts.v1";
const TERMINAL_HISTORY_LIMIT = 180;
const SYSTEM_HISTORY_LIMIT = 36;
const DISPLAY_PARAMS = new URLSearchParams(window.location.search);
const DISPLAY_ROLE = DISPLAY_PARAMS.get("displayRole") || "primary";
const DISPLAY_INDEX = Number(DISPLAY_PARAMS.get("displayIndex") || 0);
const DISPLAY_TOTAL = Number(DISPLAY_PARAMS.get("displayTotal") || 1);
const APP_VERSION = "2.0.0";

const DEFAULT_SETTINGS = {
    systemLabel: "CYBERDESK GOV OS",
    operator: "root",
    theme: "green",
    accent: "#42ff68",
    scanline: "off",
    performanceMode: "auto",
    autoLockMinutes: 10,
    startupMode: "cinematic",
    visualRevision: 18,
    favoriteLauncherIds: ["kali", "vscode", "explorer", "nmap"],
    customLaunchers: []
};

const THEME_PRESETS = {
    aqua: {
        accent: "#53fff0",
        rgb: "83, 255, 240",
        text: "#dcfff4",
        muted: "rgba(220, 255, 244, 0.68)",
        danger: "#ff4a6a",
        bg: "#02080b",
        panel: "rgba(3, 18, 22, 0.9)",
        surface: {
            "boot-bg": "linear-gradient(135deg, #000405 0, #04141a 54%, #00070a 100%)",
            "desktop-bg": "linear-gradient(135deg, #010608 0, #031820 56%, #010709 100%)",
            "topbar-bg": "#020b0f",
            "window-bg": "#031217",
            "window-body-bg": "#020c10",
            "panel-bg": "#021014",
            "input-bg": "#01080b",
            "dock-bg": "#020f12",
            "surface-98": "rgba(2, 14, 18, 0.98)",
            "surface-96": "rgba(2, 14, 18, 0.96)",
            "surface-94": "rgba(1, 13, 17, 0.94)",
            "surface-92": "rgba(0, 10, 14, 0.92)",
            "surface-88": "rgba(2, 14, 18, 0.88)",
            "surface-86": "rgba(0, 12, 16, 0.86)",
            "surface-84": "rgba(0, 12, 16, 0.84)",
            "surface-82": "rgba(0, 12, 16, 0.82)",
            "surface-78": "rgba(0, 12, 16, 0.78)",
            "surface-76": "rgba(0, 11, 15, 0.76)",
            "surface-72": "rgba(0, 11, 15, 0.72)",
            "surface-68": "rgba(0, 11, 15, 0.68)",
            "surface-62": "rgba(0, 11, 15, 0.62)",
            "surface-58": "rgba(0, 11, 15, 0.58)",
            "surface-56": "rgba(0, 12, 16, 0.56)",
            "surface-50": "rgba(0, 11, 15, 0.5)",
            "on-accent": "#00191b"
        }
    },
    green: {
        accent: "#42ff68",
        rgb: "66, 255, 104",
        text: "#d9ffe1",
        muted: "rgba(217, 255, 225, 0.68)",
        danger: "#ff4a4a",
        bg: "#020a05",
        panel: "rgba(4, 22, 10, 0.9)",
        surface: {
            "boot-bg": "linear-gradient(135deg, #000302 0, #04110d 54%, #000605 100%)",
            "desktop-bg": "linear-gradient(135deg, #010504 0, #03120e 56%, #010604 100%)",
            "topbar-bg": "#020907",
            "window-bg": "#03100b",
            "window-body-bg": "#020b08",
            "panel-bg": "#020c09",
            "input-bg": "#010805",
            "dock-bg": "#020c09",
            "surface-98": "rgba(2, 12, 9, 0.98)",
            "surface-96": "rgba(2, 12, 9, 0.96)",
            "surface-94": "rgba(1, 11, 8, 0.94)",
            "surface-92": "rgba(0, 7, 5, 0.92)",
            "surface-88": "rgba(2, 12, 9, 0.88)",
            "surface-86": "rgba(0, 8, 6, 0.86)",
            "surface-84": "rgba(0, 8, 6, 0.84)",
            "surface-82": "rgba(0, 8, 6, 0.82)",
            "surface-78": "rgba(0, 8, 6, 0.78)",
            "surface-76": "rgba(0, 7, 5, 0.76)",
            "surface-72": "rgba(0, 7, 5, 0.72)",
            "surface-68": "rgba(0, 8, 6, 0.68)",
            "surface-62": "rgba(0, 8, 6, 0.62)",
            "surface-58": "rgba(0, 8, 6, 0.58)",
            "surface-56": "rgba(0, 10, 7, 0.56)",
            "surface-50": "rgba(0, 8, 6, 0.5)",
            "on-accent": "#001b08"
        }
    },
    red: {
        accent: "#ff4a5f",
        rgb: "255, 74, 95",
        text: "#ffe2e5",
        muted: "rgba(255, 226, 229, 0.68)",
        danger: "#ffd166",
        bg: "#0b0205",
        panel: "rgba(28, 4, 10, 0.9)",
        surface: {
            "boot-bg": "linear-gradient(135deg, #050002 0, #1a0308 54%, #080102 100%)",
            "desktop-bg": "linear-gradient(135deg, #050102 0, #170308 56%, #070102 100%)",
            "topbar-bg": "#090104",
            "window-bg": "#120308",
            "window-body-bg": "#0b0205",
            "panel-bg": "#100207",
            "input-bg": "#080103",
            "dock-bg": "#100207",
            "surface-98": "rgba(18, 2, 7, 0.98)",
            "surface-96": "rgba(18, 2, 7, 0.96)",
            "surface-94": "rgba(16, 2, 6, 0.94)",
            "surface-92": "rgba(12, 1, 4, 0.92)",
            "surface-88": "rgba(18, 2, 7, 0.88)",
            "surface-86": "rgba(14, 2, 6, 0.86)",
            "surface-84": "rgba(14, 2, 6, 0.84)",
            "surface-82": "rgba(14, 2, 6, 0.82)",
            "surface-78": "rgba(14, 2, 6, 0.78)",
            "surface-76": "rgba(12, 1, 4, 0.76)",
            "surface-72": "rgba(12, 1, 4, 0.72)",
            "surface-68": "rgba(14, 2, 6, 0.68)",
            "surface-62": "rgba(14, 2, 6, 0.62)",
            "surface-58": "rgba(14, 2, 6, 0.58)",
            "surface-56": "rgba(14, 2, 6, 0.56)",
            "surface-50": "rgba(14, 2, 6, 0.5)",
            "on-accent": "#250006"
        }
    },
    purple: {
        accent: "#b78cff",
        rgb: "183, 140, 255",
        text: "#f1eaff",
        muted: "rgba(241, 234, 255, 0.68)",
        danger: "#ff5fa2",
        bg: "#07040d",
        panel: "rgba(16, 8, 30, 0.9)",
        surface: {
            "boot-bg": "linear-gradient(135deg, #030105 0, #120822 54%, #050209 100%)",
            "desktop-bg": "linear-gradient(135deg, #030105 0, #12081f 56%, #050209 100%)",
            "topbar-bg": "#07040d",
            "window-bg": "#10071c",
            "window-body-bg": "#090512",
            "panel-bg": "#0d0618",
            "input-bg": "#06030c",
            "dock-bg": "#0d0618",
            "surface-98": "rgba(13, 6, 24, 0.98)",
            "surface-96": "rgba(13, 6, 24, 0.96)",
            "surface-94": "rgba(12, 5, 22, 0.94)",
            "surface-92": "rgba(8, 4, 14, 0.92)",
            "surface-88": "rgba(13, 6, 24, 0.88)",
            "surface-86": "rgba(11, 5, 20, 0.86)",
            "surface-84": "rgba(11, 5, 20, 0.84)",
            "surface-82": "rgba(11, 5, 20, 0.82)",
            "surface-78": "rgba(11, 5, 20, 0.78)",
            "surface-76": "rgba(8, 4, 14, 0.76)",
            "surface-72": "rgba(8, 4, 14, 0.72)",
            "surface-68": "rgba(11, 5, 20, 0.68)",
            "surface-62": "rgba(11, 5, 20, 0.62)",
            "surface-58": "rgba(11, 5, 20, 0.58)",
            "surface-56": "rgba(11, 5, 20, 0.56)",
            "surface-50": "rgba(11, 5, 20, 0.5)",
            "on-accent": "#110023"
        }
    },
    minimal: {
        accent: "#e8fff9",
        rgb: "232, 255, 249",
        text: "#effffb",
        muted: "rgba(239, 255, 251, 0.62)",
        danger: "#ff6868",
        bg: "#050708",
        panel: "rgba(10, 13, 15, 0.92)",
        surface: {
            "boot-bg": "linear-gradient(135deg, #020303 0, #0d1112 54%, #030404 100%)",
            "desktop-bg": "linear-gradient(135deg, #030404 0, #101415 56%, #040505 100%)",
            "topbar-bg": "#050708",
            "window-bg": "#0c1011",
            "window-body-bg": "#070a0b",
            "panel-bg": "#090d0e",
            "input-bg": "#050707",
            "dock-bg": "#090d0e",
            "surface-98": "rgba(9, 13, 14, 0.98)",
            "surface-96": "rgba(9, 13, 14, 0.96)",
            "surface-94": "rgba(8, 11, 12, 0.94)",
            "surface-92": "rgba(6, 8, 9, 0.92)",
            "surface-88": "rgba(9, 13, 14, 0.88)",
            "surface-86": "rgba(8, 11, 12, 0.86)",
            "surface-84": "rgba(8, 11, 12, 0.84)",
            "surface-82": "rgba(8, 11, 12, 0.82)",
            "surface-78": "rgba(8, 11, 12, 0.78)",
            "surface-76": "rgba(6, 8, 9, 0.76)",
            "surface-72": "rgba(6, 8, 9, 0.72)",
            "surface-68": "rgba(8, 11, 12, 0.68)",
            "surface-62": "rgba(8, 11, 12, 0.62)",
            "surface-58": "rgba(8, 11, 12, 0.58)",
            "surface-56": "rgba(8, 11, 12, 0.56)",
            "surface-50": "rgba(8, 11, 12, 0.5)",
            "on-accent": "#050708"
        }
    }
};

const CORE_LAUNCHERS = [
    { id: "kali", name: "Kali WSL Terminal", badge: "KX", kind: "tool", target: "wsl" },
    { id: "vscode", name: "VS Code", badge: "VS", kind: "tool", target: "vscode" },
    { id: "explorer", name: "File Explorer", badge: "FS", kind: "tool", target: "explorer" },
    { id: "taskmgr", name: "Task Manager", badge: "TM", kind: "tool", target: "taskmgr" },
    { id: "control", name: "Control Panel", badge: "CP", kind: "tool", target: "control" },
    { id: "apps", name: "Applications", badge: "APP", kind: "tool", target: "apps" },
    { id: "games", name: "Games", badge: "GM", kind: "tool", target: "games" },
    { id: "github", name: "GitHub", badge: "GH", kind: "tool", target: "github" },
    { id: "proton-mail", name: "Proton Mail", badge: "PM", kind: "tool", target: "protonMail" },
    { id: "proton-pass", name: "Proton Pass", badge: "PP", kind: "tool", target: "protonPass" },
    { id: "maps", name: "Maps", badge: "MAP", kind: "tool", target: "maps" },
    { id: "youtube", name: "YouTube", badge: "YT", kind: "tool", target: "youtube" },
    { id: "wireshark", name: "Wireshark WSL", badge: "WS", kind: "shell", command: "wireshark &" },
    { id: "nmap", name: "Nmap WSL", badge: "NM", kind: "shell", command: "nmap --help | head -30" }
];

let settings = loadSettings();
let zIndexCounter = 20;
const WINDOW_Z_INDEX_BASE = 20;
const WINDOW_Z_INDEX_MAX = 1400;
let commandHistory = loadTerminalHistory();
let commandHistoryIndex = -1;
let latestSystemInfo = null;
let latestNetworkInfo = [];
let latestProcesses = [];
let activeShellMode = "wsl";
let terminalOnline = false;
let terminalStarting = false;
let pendingShellCommands = [];
let logbookEntries = loadLogbookEntries();
let databaseEntries = loadDatabaseEntries();
let paletteCommands = [];
let displayMode = "primary";
let updateFeedUrl = "";
let updateStatus = null;
let lastUpdateStatusKey = "";
let launcherSearchQuery = "";
let launcherCategory = "all";
let logbookSearchQuery = "";
let activeTerminalTabId = "main";
let terminalFilterQuery = "";
let terminalTabs = [{
    id: "main",
    name: "Main",
    lines: []
}];
let currentAuthUser = null;
let authState = {
    hasUsers: false,
    dbPath: ""
};
let systemHistory = {
    cpu: [],
    ram: []
};
let toastCounter = 0;
let overviewRenderQueued = false;
let autoLockTimer = null;
let lastActivityAt = Date.now();
let lastActivityTick = 0;
let securitySweepState = {
    status: "standby",
    risk: "green",
    tone: "normal",
    lastRun: "never",
    directive: "run sweep"
};

/* ===================================================== */
/* SETTINGS STORAGE: leggi e salva impostazioni locali */
/* ===================================================== */

function loadSettings() {
    try {
        const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY));

        if (!stored || typeof stored !== "object") {
            return structuredClone(DEFAULT_SETTINGS);
        }

        const storedRevision = Number(stored.visualRevision || 0);
        const settings = {
            ...DEFAULT_SETTINGS,
            ...stored,
            favoriteLauncherIds: Array.isArray(stored.favoriteLauncherIds)
                ? stored.favoriteLauncherIds.map(String)
                : [...DEFAULT_SETTINGS.favoriteLauncherIds],
            customLaunchers: Array.isArray(stored.customLaunchers)
                ? stored.customLaunchers.map(normalizeLauncher).filter(Boolean)
                : []
        };

        if (!THEME_PRESETS[settings.theme]) {
            settings.theme = DEFAULT_SETTINGS.theme;
        }

        settings.autoLockMinutes = normalizeAutoLockMinutes(settings.autoLockMinutes);

        if (storedRevision < DEFAULT_SETTINGS.visualRevision) {
            settings.theme = DEFAULT_SETTINGS.theme;
            settings.startupMode = DEFAULT_SETTINGS.startupMode;
            settings.performanceMode = DEFAULT_SETTINGS.performanceMode;
            settings.scanline = DEFAULT_SETTINGS.scanline;
            settings.autoLockMinutes = DEFAULT_SETTINGS.autoLockMinutes;
            settings.visualRevision = DEFAULT_SETTINGS.visualRevision;

            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        }

        return settings;
    } catch {
        return structuredClone(DEFAULT_SETTINGS);
    }
}

function persistSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function normalizeAutoLockMinutes(value) {
    const minutes = Number(value);

    if (!Number.isFinite(minutes) || minutes < 0) {
        return DEFAULT_SETTINGS.autoLockMinutes;
    }

    return Math.min(120, Math.round(minutes));
}

function isLitePerformance() {
    if (settings.performanceMode === "full") {
        return false;
    }

    if (settings.performanceMode === "lite") {
        return true;
    }

    const cores = navigator.hardwareConcurrency || latestSystemInfo?.cpus || 4;
    const deviceMemory = Number(navigator.deviceMemory || 0);
    const lowDeviceMemory = deviceMemory > 0 && deviceMemory <= 4;
    const ramPressure = latestSystemInfo ? latestSystemInfo.ram >= 72 : false;

    return cores <= 4 || lowDeviceMemory || ramPressure;
}

function isFastStartup() {
    return settings.startupMode !== "cinematic";
}

function loadTerminalHistory() {
    try {
        const items = JSON.parse(localStorage.getItem(TERMINAL_HISTORY_KEY));

        return Array.isArray(items)
            ? items.map(String).slice(-TERMINAL_HISTORY_LIMIT)
            : [];
    } catch {
        return [];
    }
}

function persistTerminalHistory() {
    localStorage.setItem(TERMINAL_HISTORY_KEY, JSON.stringify(commandHistory.slice(-TERMINAL_HISTORY_LIMIT)));
}

function loadCustomLayouts() {
    try {
        const layouts = JSON.parse(localStorage.getItem(CUSTOM_LAYOUTS_KEY));

        return layouts && typeof layouts === "object" ? layouts : {};
    } catch {
        return {};
    }
}

function persistCustomLayouts(layouts) {
    localStorage.setItem(CUSTOM_LAYOUTS_KEY, JSON.stringify(layouts));
}

/* ===================================================== */
/* LOGBOOK STORAGE: appunti locali del laboratorio V2 */
/* ===================================================== */

function loadLogbookEntries() {
    try {
        const entries = JSON.parse(localStorage.getItem(LOGBOOK_KEY));

        return Array.isArray(entries)
            ? entries.filter(entry => entry && typeof entry.text === "string")
            : [];
    } catch {
        return [];
    }
}

function persistLogbookEntries() {
    localStorage.setItem(LOGBOOK_KEY, JSON.stringify(logbookEntries));
}

/* ===================================================== */
/* DATABASE STORAGE: archivio locale ricercabile */
/* ===================================================== */

function loadDatabaseEntries() {
    try {
        const entries = JSON.parse(localStorage.getItem(DATABASE_KEY));

        return Array.isArray(entries)
            ? entries.filter(entry => entry && typeof entry.content === "string").map(normalizeDatabaseEntry)
            : [];
    } catch {
        return [];
    }
}

function normalizeDatabaseEntry(entry) {
    const content = String(entry.content || "").trim();
    const title = String(entry.title || content.slice(0, 48) || "Untitled record").trim();
    const tags = Array.isArray(entry.tags)
        ? entry.tags.map(String)
        : String(entry.tags || "").split(",");

    return {
        id: entry.id || `db-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000).toString(36)}`,
        title,
        content,
        tags: tags.map(tag => tag.trim()).filter(Boolean).slice(0, 12),
        createdAt: entry.createdAt || new Date().toISOString(),
        updatedAt: entry.updatedAt || entry.createdAt || new Date().toISOString()
    };
}

function persistDatabaseEntries() {
    localStorage.setItem(DATABASE_KEY, JSON.stringify(databaseEntries));
}

function normalizeLauncher(launcher) {
    if (!launcher || typeof launcher !== "object") {
        return null;
    }

    const name = String(launcher.name || "").trim();
    const target = String(launcher.target || "").trim();

    if (!name || !target) {
        return null;
    }

    const type = ["url", "folder", "app"].includes(launcher.type)
        ? launcher.type
        : "url";

    return {
        id: launcher.id || `custom-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name,
        badge: buildBadge(launcher.badge || name),
        kind: "custom",
        type,
        target
    };
}

function buildBadge(value) {
    const clean = String(value || "OS")
        .replace(/[^a-z0-9]/gi, "")
        .slice(0, 3)
        .toUpperCase();

    return clean || "OS";
}

function getAllLaunchers() {
    return [...CORE_LAUNCHERS, ...settings.customLaunchers];
}

/* ===================================================== */
/* BOOT SEQUENCE: avvio visivo prima di mostrare il desktop */
/* ===================================================== */

const bootMessages = [
    "[ INIT ] decrypting operator profile",
    "[ CORE ] loading neon kernel interface",
    "[ WSL  ] mounting Kali command bridge",
    "[ FS   ] indexing /mnt/c search routes",
    "[ APPS ] loading workspace modules",
    "[ UI   ] caching app shortcut hub",
    "[ SYS  ] priming CPU and RAM charts",
    "[ BUS  ] starting matrix command bus",
    "[ GPU  ] arming zoom window compositor",
    "[ OK   ] CyberDesk secure session granted"
];

const BOOT_SCRIPT_COMMANDS = [
    "sudo cyberdeskctl init --profile operator --mode ethical",
    "wsl.exe --distribution kali-linux -- bash -lc 'printf READY'",
    "mount --bind /mnt/c ~/workspace --index-only",
    "ip addr show dev eth0 | awk '/inet / {print $2}'",
    "systemctl --user start cyberdesk-compositor.service",
    "cyberdesk-workspace preload --apps terminal,monitor,launcher",
    "find /mnt/c/Users -maxdepth 3 -type d -name Desktop 2>/dev/null",
    "journalctl --user -n 4 --no-pager | tail -1",
    "sha256sum ~/.cyberdesk/session.key | cut -c1-16",
    "cyberdeskctl ping-bus --demo-nodes 96 --safe"
];

/* BOOT DISPLAY PROFILES: ogni monitor mostra un avvio con ruolo diverso. */
const BOOT_DISPLAY_PROFILES = {
    primary: {
        roleLabel: "GOV PRIMARY CONTROL / KALI WSL BRIDGE",
        modeLabel: "GOV COMMAND CENTER",
        subtitle: "Primary local workspace: terminal, monitor, launcher, operator notes and secure lab tools.",
        bootLabel: "GOV PRIMARY CONTROL BOOT",
        modules: ["WSL BRIDGE", "SYSTEM MONITOR", "COMMAND BUS", "APP LAUNCHER"],
        commands: [
            "cyberdeskctl init --role primary --workspace command-center",
            "kali-bridge probe --shell /bin/bash --scope local",
            "systemctl --user status cyberdesk-compositor --no-pager",
            "watch -n 0.5 'uptime && free -h | head -2'",
            "journalctl --user -n 6 --no-pager | tail -1",
            "fs-index warm-cache --route /mnt/c --limit 2048",
            "matrix-bus publish display/primary --state armed",
            "ui-compositor layout --profile primary --dock right"
        ],
        wallTemplates: [
            "command-center hydrate --overview --terminal --monitor",
            "wsl-session attach --distro kali-linux --mode interactive",
            "sysmon stream --cpu --mem --disk --local-only",
            "launcherctl enumerate --custom --core --safe",
            "audit local-workspace --no-remote-targets --operator root"
        ]
    },
    dashboard: {
        roleLabel: "GOV DASHBOARD WALL / NETWORK VIEW",
        modeLabel: "GOV NETWORK DASHBOARD",
        subtitle: "Secondary display: local network status, system monitor, launcher and WSL command guidance.",
        bootLabel: "GOV DASHBOARD WALL BOOT",
        modules: ["NETWORK CENTER", "SYSTEM MONITOR", "APP LAUNCHER", "LOCAL FEED"],
        commands: [
            "netctl preload --interfaces local --safe",
            "launcherctl hydrate --desktop --start-menu",
            "sysmon stream --cpu --ram --processes",
            "workspacectl calibrate --layout dashboard",
            "netstat -rn 2>/dev/null | head -6",
            "tracepath 127.0.0.1 2>/dev/null | head -5",
            "matrixctl render --layer workspace --color aqua",
            "ui-compositor layout --profile dashboard-wall --dock right"
        ],
        wallTemplates: [
            "workspace-cache warm --apps core --shortcuts ready",
            "network-panel render --interfaces --gateway --local-only",
            "launcher-grid render --favorites --custom",
            "monitor-panel stream --host --uptime",
            "workspace-feed annotate --safe-local-ops"
        ]
    },
    ops: {
        roleLabel: "GOV OPS WALL / LINUX COMMAND DECK",
        modeLabel: "GOV KALI OPS WALL",
        subtitle: "Operations display: WSL command academy, Kali command deck, terminal and operator logbook.",
        bootLabel: "GOV KALI OPS WALL BOOT",
        modules: ["KALI OPS", "WSL COMMANDS", "LOCAL LOGBOOK", "SAFE LAB"],
        commands: [
            "cyberdeskctl init --role ops --workspace kali-command-deck",
            "compgen -c | sort | uniq | head -24",
            "man bash | col -b | sed -n '1,6p'",
            "apt list --installed 2>/dev/null | head -8",
            "ip addr show | sed -n '1,10p'",
            "history | tail -12",
            "logbookctl open --local --operator root",
            "ui-compositor layout --profile ops-wall --dock right"
        ],
        wallTemplates: [
            "academy render --section linux-basics --interactive",
            "ops-grid arm --safe-actions --localhost-only",
            "logbook stream --workspace local-lab --append-ready",
            "terminal-preset load --nmap-help --network-local",
            "command-index teach --category file-system --category process"
        ]
    }
};

const LAUNCH_SCRIPT_COMMANDS = [
    "cyberdeskctl focus --target \"{target}\" --zoom compositor",
    "kali-bridge exec --safe --module \"{target}\"",
    "renderctl shader neon-open --window \"{target}\"",
    "auditctl local-session --operator root --event launch",
    "matrix-bus publish launch/{slug} --status pending",
    "fs-index warm-cache --route /mnt/c --limit 2048",
    "net-cache inspect --scope local --no-remote-targets",
    "ui compositor attach --effect zoom-script --token {hex}",
    "sessionctl grant --module \"{target}\" --ttl 90s",
    "matrix-bus publish launch/{slug} --status ready"
];

const WSL_COMMAND_GROUPS = [
    {
        title: "Orientamento",
        commands: [
            ["pwd", "Mostra la cartella corrente"],
            ["whoami", "Mostra l'utente Linux attuale"],
            ["hostname", "Mostra il nome macchina"],
            ["date", "Mostra data e ora"],
            ["uname -a", "Informazioni kernel Linux"],
            ["cat /etc/os-release", "Versione della distro"]
        ]
    },
    {
        title: "File e cartelle",
        commands: [
            ["ls -lah", "Lista file dettagliata"],
            ["cd /mnt/c/Users/steal", "Vai alla cartella Windows utente"],
            ["tree -L 2 2>/dev/null || find . -maxdepth 2", "Albero cartelle leggero"],
            ["find . -maxdepth 2 -type f | head -40", "Trova file vicini"],
            ["du -sh * 2>/dev/null | sort -h", "Dimensione file/cartelle"],
            ["stat package.json 2>/dev/null || stat .", "Dettagli su file/cartella"]
        ]
    },
    {
        title: "Lettura testo",
        commands: [
            ["cat README.md 2>/dev/null || echo 'README non trovato'", "Leggi un file"],
            ["less README.md", "Leggi con pager"],
            ["head -40 app/renderer.js 2>/dev/null", "Prime righe di un file"],
            ["tail -40 app/renderer.js 2>/dev/null", "Ultime righe di un file"],
            ["grep -R \"TODO\" -n . 2>/dev/null | head", "Cerca testo nei file"],
            ["wc -l app/*.js app/*.css app/*.html 2>/dev/null", "Conta righe"]
        ]
    },
    {
        title: "Processi e risorse",
        commands: [
            ["ps aux | head -20", "Processi attivi"],
            ["top", "Monitor interattivo"],
            ["free -h", "RAM libera/usata"],
            ["df -h", "Dischi e spazio"],
            ["uptime", "Tempo di attività e carico"],
            ["kill -l | head", "Segnali disponibili"]
        ]
    },
    {
        title: "Rete locale",
        commands: [
            ["ip addr", "Interfacce e IP locali"],
            ["ip route", "Tabella routing"],
            ["ss -tulpn 2>/dev/null || netstat -tulpn 2>/dev/null", "Porte in ascolto"],
            ["ping -c 4 127.0.0.1", "Test localhost"],
            ["cat /etc/resolv.conf", "DNS configurati"],
            ["curl -I https://example.com", "Test HTTP innocuo"]
        ]
    },
    {
        title: "Archivi e pacchetti",
        commands: [
            ["tar --help | head -30", "Aiuto archivi tar"],
            ["zip -h 2>/dev/null || echo 'zip non installato'", "Aiuto zip"],
            ["apt --version", "Versione apt"],
            ["apt list --installed 2>/dev/null | head", "Pacchetti installati"],
            ["which bash zsh git node npm python3 2>/dev/null", "Dove sono i programmi"],
            ["man ls", "Manuale del comando ls"]
        ]
    },
    {
        title: "Git e sviluppo",
        commands: [
            ["git --version", "Versione Git"],
            ["git status 2>/dev/null || echo 'Non sei in una repo git'", "Stato repository"],
            ["node --version 2>/dev/null || echo 'node non installato in WSL'", "Versione Node"],
            ["npm --version 2>/dev/null || echo 'npm non installato in WSL'", "Versione npm"],
            ["python3 --version 2>/dev/null || echo 'python3 non installato'", "Versione Python"],
            ["code . 2>/dev/null || echo 'VS Code CLI non disponibile'", "Apri VS Code dal percorso"]
        ]
    },
    {
        title: "Help rapido",
        commands: [
            ["help", "Comandi shell built-in"],
            ["compgen -c | sort | uniq | less", "Lista quasi tutti i comandi disponibili nella shell"],
            ["ls /bin /usr/bin /usr/local/bin 2>/dev/null | sort | uniq | less", "Programmi installati nelle cartelle principali"],
            ["man bash", "Manuale bash"],
            ["history | tail -30", "Ultimi comandi usati"],
            ["alias", "Alias configurati"],
            ["env | sort | head -40", "Variabili ambiente"],
            ["clear", "Pulisci terminale"]
        ]
    }
];

function getBootProfile() {
    return BOOT_DISPLAY_PROFILES[DISPLAY_ROLE] || BOOT_DISPLAY_PROFILES.ops;
}

function initializeBootProfile() {
    const profile = getBootProfile();
    const bootModules = Array.from(document.querySelectorAll("[data-boot-module]"));

    document.body.dataset.displayRole = DISPLAY_ROLE;
    document.body.dataset.displayIndex = String(DISPLAY_INDEX);
    document.body.dataset.displayTotal = String(DISPLAY_TOTAL);

    setText("bootRoleLabel", profile.roleLabel);
    setText("bootModeLabel", profile.modeLabel);
    setText("bootSubtitle", profile.subtitle);
    setText("bootStatusLine", `${profile.bootLabel} :: 000% :: DISPLAY ${DISPLAY_INDEX + 1}/${DISPLAY_TOTAL}`);
    setText("bootVersionBadge", `CYBERDESK v${APP_VERSION}`);
    setText("bootVersionHud", `v${APP_VERSION}`);
    setText("bootDisplayId", `${DISPLAY_ROLE.toUpperCase()} ${DISPLAY_INDEX + 1}/${DISPLAY_TOTAL}`);
    setText("bootSessionId", `LOCAL-${randomHex(4).toUpperCase()}`);
    setText("bootStageLabel", "STANDBY");

    bootModules.forEach((module, index) => {
        module.textContent = profile.modules[index] || module.textContent;
    });
}

function runBootSequence(forceCinematic = false) {
    const bootFeed = document.getElementById("bootFeed");
    const bootProgress = document.getElementById("bootProgress");
    const bootPercent = document.getElementById("bootPercent");
    const bootScriptConsole = document.getElementById("bootScriptConsole");
    const bootStatusLine = document.getElementById("bootStatusLine");
    const bootModules = Array.from(document.querySelectorAll("[data-boot-module]"));
    const desktop = document.getElementById("desktop");
    const bootScreen = document.getElementById("bootScreen");
    const bootProfile = getBootProfile();
    const lite = isLitePerformance();

    resetBootSequenceUi();

    if (!forceCinematic && isFastStartup()) {
        finishBootSequence(bootScreen, desktop);
        return;
    }

    let index = 0;

    const timer = setInterval(() => {
        if (!lite || index % 3 === 0) {
            renderBootCodeWall();
        }

        const line = document.createElement("p");
        line.textContent = bootMessages[index];
        bootFeed.appendChild(line);

        while (bootFeed.children.length > 8) {
            bootFeed.firstElementChild.remove();
        }

        index++;
        const progress = Math.round((index / bootMessages.length) * 100);
        const percent = String(progress).padStart(3, "0");
        bootProgress.style.width = `${progress}%`;

        if (bootPercent) {
            bootPercent.textContent = `${percent}%`;
        }

        updateBootTelemetry(progress, index, bootMessages[index - 1] || "READY");

        bootModules.forEach((module, moduleIndex) => {
            module.classList.toggle("is-active", progress >= (moduleIndex + 1) * 22);
        });

        if (!lite || index % 2 === 0 || progress >= 100) {
            renderBootScriptConsole(bootScriptConsole, index, progress);
        }

        if (bootStatusLine) {
            bootStatusLine.textContent = `${bootProfile.bootLabel} :: ${percent}% :: DISPLAY ${DISPLAY_INDEX + 1}/${DISPLAY_TOTAL}`;
        }

        if (index >= bootMessages.length) {
            clearInterval(timer);

            setTimeout(() => {
                finishBootSequence(bootScreen, desktop, forceCinematic ? "cinematic" : settings.startupMode);
            }, 450);
        }
    }, lite ? 170 : 260);
}

function resetBootSequenceUi() {
    const bootFeed = document.getElementById("bootFeed");
    const bootProgress = document.getElementById("bootProgress");
    const bootPercent = document.getElementById("bootPercent");
    const bootScriptConsole = document.getElementById("bootScriptConsole");

    if (bootFeed) {
        bootFeed.innerHTML = "";
    }

    if (bootProgress) {
        bootProgress.style.width = "0%";
    }

    document.querySelectorAll("[data-boot-module]").forEach(module => {
        module.classList.remove("is-active");
    });

    setText("bootPercent", "000%");
    setText("bootCorePercent", "0%");
    setText("bootSessionId", `LOCAL-${randomHex(4).toUpperCase()}`);
    setText("bootDisplayId", `${DISPLAY_ROLE.toUpperCase()} ${DISPLAY_INDEX + 1}/${DISPLAY_TOTAL}`);
    setText("bootStageLabel", "STANDBY");
    setText("bootTelemetryCpu", "--%");
    setText("bootTelemetryCache", "--%");
    setText("bootTelemetryWs", "IDLE");
    setText("bootTelemetryFx", "ARMED");

    renderBootScriptConsole(bootScriptConsole, 0, 0);
    renderBootCodeWall();
}

function updateBootTelemetry(progress, step, message) {
    const compactStage = String(message)
        .replace(/^\[\s*([^\]]+)\s*\]\s*/, "$1 / ")
        .slice(0, 32)
        .toUpperCase();
    const cpuFrame = Math.min(99, 18 + Math.round(progress * 0.68));
    const appCache = Math.min(100, Math.round(progress * 0.92));

    setText("bootCorePercent", `${progress}%`);
    setText("bootStageLabel", compactStage || "STREAMING");
    setText("bootTelemetryCpu", `${cpuFrame}%`);
    setText("bootTelemetryCache", `${appCache}%`);
    setText("bootTelemetryWs", progress > 42 ? "LINKED" : "WARMING");
    setText("bootTelemetryFx", step % 2 === 0 ? "SYNC" : "ARMED");
}

function finishBootSequence(bootScreen, desktop, startupMode = settings.startupMode) {
    if (bootScreen) {
        if (startupMode === "cinematic") {
            bootScreen.classList.add("boot-exit");
            setTimeout(() => {
                bootScreen.classList.add("hidden");
            }, 720);
        } else {
            bootScreen.classList.add("hidden");
        }
    }

    if (currentAuthUser) {
        startDesktopAfterAuth(startupMode);
        return;
    }

    showAuthGate();
}

function replayBootSequence() {
    const bootScreen = document.getElementById("bootScreen");
    const desktop = document.getElementById("desktop");

    if (!bootScreen) {
        return;
    }

    bootScreen.classList.remove("hidden", "boot-exit");

    if (desktop) {
        desktop.classList.add("hidden");
    }

    document.getElementById("authScreen")?.classList.add("hidden");

    runBootSequence(true);
    hideSystemMenu();
}

function applyFastStartupProfile() {
    document.querySelectorAll(".os-window").forEach(windowElement => {
        windowElement.classList.add("hidden-window");
        windowElement.classList.remove("active-window");
    });

    const overview = document.getElementById("overviewWindow");

    if (overview) {
        applyProfileGeometry(overview, { id: "overviewWindow", left: 112, top: 56, width: 820, height: 570 });
        openWindow("overviewWindow", { skipLaunchScript: true });
        focusWindow("overviewWindow");
    }

    setText("overviewStatus", "FAST DESKTOP :: manual terminal start :: lightweight launch");
    showToast("Fast startup", "Boot screen skipped. Open Terminal when you need WSL.");
}

function renderBootScriptConsole(target, step, progress) {
    if (!target) {
        return;
    }

    const profile = getBootProfile();
    const commands = profile.commands || BOOT_SCRIPT_COMMANDS;
    const lines = [
        `root@cyberdesk:~$ ./init-cyberdesk.sh --display ${DISPLAY_INDEX + 1} --role ${DISPLAY_ROLE}`,
        `progress=${String(progress).padStart(3, "0")} session=${randomHex(10)} compositor=neon-aqua`
    ];

    for (let index = 0; index < 8; index++) {
        const command = commands[(step + index) % commands.length];
        lines.push(`  ${command}  # ${randomHex(6)}`);
    }

    lines.push(`status: ${progress >= 100 ? "READY" : "STREAMING"} :: authorized local lab only`);
    target.textContent = lines.join("\n");
}

function renderBootCodeWall() {
    const wall = document.getElementById("bootCodeWall");

    if (!wall) {
        return;
    }

    const profile = getBootProfile();
    const templates = [
        "watch --interval=0.2 cyberdeskctl sensors --local",
        "route add overlay/satellite --provider hybrid --cache warm",
        "for node in $(seq 01 96); do pingbus --demo $node --ttl 4; done",
        "openssl rand -hex 8 | xargs sessionctl attach --visual",
        "journalctl --user -f cyberdesk-compositor | sed -n '1,4p'",
        "awk '{print $1,$2,$3}' /proc/net/dev | column -t",
        "matrixctl render --mode aqua --depth cinematic --grain 0.18",
        "kali-bridge status --shell /bin/bash --scope local",
        "netctl inventory --local --interfaces active",
        "ui.bus.emit('window:prepare', { effect: 'zoom-script' })"
    ].concat(profile.wallTemplates || []);
    const lineCount = isLitePerformance() ? 16 : 34;
    const lines = Array.from({ length: lineCount }, (_, index) => {
        const prefix = String(index + 1).padStart(2, "0");
        const hash = randomHex(6);
        const template = templates[(index + Math.floor(Math.random() * templates.length)) % templates.length];

        return `${prefix}  ${hash}  ${template}`;
    });

    wall.textContent = lines.join("\n");
}

/* ===================================================== */
/* THEME: applica colore, identita e scanline */
/* ===================================================== */

function applySettings() {
    const theme = THEME_PRESETS[settings.theme] || THEME_PRESETS.green;
    const surface = theme.surface || THEME_PRESETS.green.surface;

    settings.accent = theme.accent;
    document.documentElement.style.setProperty("--accent", theme.accent);
    document.documentElement.style.setProperty("--accent-rgb", theme.rgb);
    document.documentElement.style.setProperty("--text", theme.text);
    document.documentElement.style.setProperty("--muted", theme.muted);
    document.documentElement.style.setProperty("--danger", theme.danger);
    document.documentElement.style.setProperty("--bg", theme.bg);
    document.documentElement.style.setProperty("--panel", theme.panel);
    document.documentElement.style.setProperty("--film-cyan", theme.accent);
    document.documentElement.style.setProperty("--film-mint", theme.text);
    document.documentElement.style.setProperty("--film-glass-strong", theme.panel);
    Object.entries(surface).forEach(([name, value]) => {
        document.documentElement.style.setProperty(`--${name}`, value);
    });
    document.body.dataset.theme = settings.theme;
    document.body.dataset.startupMode = settings.startupMode;
    document.body.classList.toggle("scanline-off", settings.scanline === "off");
    document.body.classList.toggle("performance-lite", isLitePerformance());

    setSystemButtonLabel(settings.systemLabel);
    setText("workspaceLabel", `workspace: ${settings.operator}@kali-wsl`);
    setText("activeWindowLabel", `${settings.operator}@kali:~`);
    setText("appVersionTop", `v${APP_VERSION}`);
    setText("settingsVersion", `v${APP_VERSION}`);
    setInputValue("settingSystemLabel", settings.systemLabel);
    setInputValue("settingOperator", settings.operator);
    setInputValue("settingTheme", settings.theme);
    setInputValue("settingScanline", settings.scanline);
    setInputValue("settingPerformanceMode", settings.performanceMode);
    setInputValue("settingAutoLock", String(settings.autoLockMinutes));
    setInputValue("settingStartupMode", settings.startupMode);
    setInputValue("settingDisplayMode", displayMode);
    setInputValue("settingUpdateFeed", updateFeedUrl);

    renderLaunchers();
    buildPaletteCommands();
    renderOverview();
}

function hexToRgb(hex) {
    const clean = String(hex || "#00ff22").replace("#", "");

    if (!/^[0-9a-f]{6}$/i.test(clean)) {
        return "0, 255, 34";
    }

    const value = parseInt(clean, 16);
    return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function setTone(id, tone = "normal") {
    const element = document.getElementById(id);

    if (element) {
        element.dataset.tone = tone;
    }
}

function setSystemButtonLabel(value) {
    const label = document.querySelector("#systemMenuButton span");
    const clean = String(value || DEFAULT_SETTINGS.systemLabel).trim();
    const compact = clean.toUpperCase().startsWith("CYBERDESK")
        ? "CYBERDESK"
        : clean.slice(0, 14);

    if (label) {
        label.textContent = compact;
        label.title = clean;
    }
}

function setInputValue(id, value) {
    const input = document.getElementById(id);

    if (input) {
        input.value = value || "";
    }
}

/* ===================================================== */
/* AUTH UI: login locale e gestione account */
/* ===================================================== */

async function initializeAuth() {
    document.getElementById("authLoginForm")?.addEventListener("submit", event => {
        event.preventDefault();
        loginAccount();
    });
    document.getElementById("authCreateForm")?.addEventListener("submit", event => {
        event.preventDefault();
        createAccount();
    });

    await refreshAuthState();
    updateAuthUi();
}

async function refreshAuthState() {
    try {
        const response = await ipcRenderer.invoke("auth-get-state");

        if (response?.ok) {
            authState = {
                hasUsers: Boolean(response.hasUsers),
                dbPath: response.dbPath || ""
            };
            currentAuthUser = response.currentUser || currentAuthUser;
        }
    } catch {
        setAuthStatus("Auth database unavailable.", "danger");
    }
}

function showAuthGate() {
    const desktop = document.getElementById("desktop");
    const authScreen = document.getElementById("authScreen");

    desktop?.classList.add("hidden");
    authScreen?.classList.remove("hidden");
    setAuthStatus(authState.hasUsers ? "Login with your local account." : "Create the first admin account.", "normal");
    updateAuthUi();
    setTimeout(() => {
        const target = authState.hasUsers ? "authLoginUsername" : "authCreateDisplay";
        document.getElementById(target)?.focus();
    }, 60);
}

function startDesktopAfterAuth(startupMode = settings.startupMode) {
    const desktop = document.getElementById("desktop");
    const authScreen = document.getElementById("authScreen");

    authScreen?.classList.add("hidden");
    desktop?.classList.remove("hidden");
    updateAuthUi();

    if (startupMode === "cinematic") {
        applyDisplayProfile();
    } else {
        applyFastStartupProfile();
    }
}

async function loginAccount() {
    const username = readInput("authLoginUsername");
    const password = readInput("authLoginPassword");

    setAuthStatus("Checking credentials...", "normal");

    try {
        const response = await ipcRenderer.invoke("auth-login", { username, password });

        if (!response?.ok) {
            setAuthStatus(response?.message || "Login failed.", "danger");
            return;
        }

        currentAuthUser = response.user;
        authState.dbPath = response.dbPath || authState.dbPath;
        clearAuthForms();
        appendTerminal(`Account login: ${currentAuthUser.username}`);
        startDesktopAfterAuth(settings.startupMode);
        showToast("Login", currentAuthUser.displayName || currentAuthUser.username);
    } catch {
        setAuthStatus("Login service unavailable.", "danger");
    }
}

async function createAccount() {
    const displayName = readInput("authCreateDisplay");
    const username = readInput("authCreateUsername");
    const password = readInput("authCreatePassword");

    setAuthStatus("Creating local account...", "normal");

    try {
        const response = await ipcRenderer.invoke("auth-create-account", {
            displayName,
            username,
            password
        });

        if (!response?.ok) {
            setAuthStatus(response?.message || "Account creation failed.", "danger");
            return;
        }

        currentAuthUser = response.user;
        authState = {
            hasUsers: true,
            dbPath: response.dbPath || authState.dbPath
        };
        clearAuthForms();
        appendTerminal(`Account created: ${currentAuthUser.username}`);
        startDesktopAfterAuth(settings.startupMode);
        showToast("Account created", currentAuthUser.role === "admin" ? "Admin ready" : "User ready");
    } catch {
        setAuthStatus("Account service unavailable.", "danger");
    }
}

async function logoutAccount() {
    try {
        await ipcRenderer.invoke("auth-logout");
    } catch {
        // Local logout still clears the renderer state if IPC is unavailable.
    }

    currentAuthUser = null;
    hideSystemMenu();
    document.querySelectorAll(".os-window").forEach(windowElement => {
        windowElement.classList.add("hidden-window");
        windowElement.classList.remove("active-window");
    });
    renderTaskbar();
    showAuthGate();
}

function clearAuthForms() {
    ["authLoginPassword", "authCreatePassword"].forEach(id => setInputValue(id, ""));
}

function setAuthStatus(message, tone = "normal") {
    const status = document.getElementById("authStatus");

    if (status) {
        status.textContent = message;
        status.dataset.tone = tone;
    }
}

function updateAuthUi() {
    const label = currentAuthUser
        ? `${currentAuthUser.displayName || currentAuthUser.username} / ${currentAuthUser.role}`
        : "locked";

    setText("authSessionLabel", label);
    setText("accountDbPath", authState.dbPath || "not created yet");
    setText("authDatabasePath", authState.dbPath || "First account creates the local database");
    setText("authCreateHint", authState.hasUsers ? "New accounts start as user. Admins can change roles." : "First account becomes admin.");
    document.body.dataset.authenticated = currentAuthUser ? "true" : "false";
    document.body.dataset.authRole = currentAuthUser?.role || "guest";
}

async function refreshAccountUsers() {
    const list = document.getElementById("accountUserList");

    if (!list) {
        return;
    }

    list.innerHTML = "";
    setText("accountAdminStatus", "Loading users...");

    try {
        const response = await ipcRenderer.invoke("auth-list-users");

        if (!response?.ok) {
            setText("accountAdminStatus", response?.message || "Admin access required.");
            list.innerHTML = "<p>Only admin accounts can manage users.</p>";
            return;
        }

        authState.dbPath = response.dbPath || authState.dbPath;
        updateAuthUi();
        setText("accountAdminStatus", `${response.users.length} local account(s).`);
        renderAccountUsers(response.users);
    } catch {
        setText("accountAdminStatus", "User database unavailable.");
    }
}

function renderAccountUsers(users = []) {
    const list = document.getElementById("accountUserList");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    users.forEach(user => {
        const card = document.createElement("article");

        card.className = "account-user-card";
        card.innerHTML = `
            <header>
                <div>
                    <strong>${escapeHtml(user.displayName || user.username)}</strong>
                    <span>@${escapeHtml(user.username)} :: ${escapeHtml(user.role)} :: ${user.online ? "online" : "offline"}</span>
                </div>
                <span>${user.disabled ? "DISABLED" : "ACTIVE"} / logins ${escapeHtml(String(user.loginCount || 0))}</span>
            </header>
            <div class="account-user-form" data-account="${escapeHtml(user.username)}">
                <label>
                    Display name
                    <input data-account-field="displayName" type="text" value="${escapeHtml(user.displayName || user.username)}">
                </label>
                <label>
                    Role
                    <select data-account-field="role">
                        <option value="user"${user.role === "user" ? " selected" : ""}>User</option>
                        <option value="admin"${user.role === "admin" ? " selected" : ""}>Admin</option>
                    </select>
                </label>
                <label>
                    New password
                    <input data-account-field="newPassword" type="password" placeholder="leave empty">
                </label>
                <label>
                    Disabled
                    <select data-account-field="disabled">
                        <option value="false"${!user.disabled ? " selected" : ""}>No</option>
                        <option value="true"${user.disabled ? " selected" : ""}>Yes</option>
                    </select>
                </label>
            </div>
            <small>Created ${escapeHtml(formatAuthDate(user.createdAt))} / Last login ${escapeHtml(formatAuthDate(user.lastLoginAt))}</small>
            <div class="account-user-actions">
                <button type="button" data-account-save="${escapeHtml(user.username)}">Save</button>
                <button type="button" data-account-delete="${escapeHtml(user.username)}">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });

    list.querySelectorAll("[data-account-save]").forEach(button => {
        button.addEventListener("click", () => saveAccountUser(button.dataset.accountSave));
    });
    list.querySelectorAll("[data-account-delete]").forEach(button => {
        button.addEventListener("click", () => deleteAccountUser(button.dataset.accountDelete));
    });
}

async function saveAccountUser(username) {
    const form = document.querySelector(`[data-account="${cssEscape(username)}"]`);

    if (!form) {
        return;
    }

    const payload = {
        username,
        displayName: form.querySelector('[data-account-field="displayName"]')?.value || "",
        role: form.querySelector('[data-account-field="role"]')?.value || "user",
        disabled: form.querySelector('[data-account-field="disabled"]')?.value === "true",
        newPassword: form.querySelector('[data-account-field="newPassword"]')?.value || ""
    };

    try {
        const response = await ipcRenderer.invoke("auth-update-user", payload);

        setText("accountAdminStatus", response?.message || "User update complete.");
        if (response?.ok) {
            if (response.user?.username === currentAuthUser?.username) {
                currentAuthUser = response.user;
            }
            authState.dbPath = response.dbPath || authState.dbPath;
            updateAuthUi();
            renderAccountUsers(response.users || []);
        }
    } catch {
        setText("accountAdminStatus", "Could not update user.");
    }
}

async function deleteAccountUser(username) {
    try {
        const response = await ipcRenderer.invoke("auth-delete-user", { username });

        setText("accountAdminStatus", response?.message || "Delete complete.");
        if (response?.ok) {
            authState.dbPath = response.dbPath || authState.dbPath;
            updateAuthUi();
            renderAccountUsers(response.users || []);
        }
    } catch {
        setText("accountAdminStatus", "Could not delete user.");
    }
}

function formatAuthDate(value) {
    if (!value) {
        return "never";
    }

    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
}

function cssEscape(value) {
    if (window.CSS?.escape) {
        return CSS.escape(value);
    }

    return String(value).replace(/["\\]/g, "\\$&");
}

/* ===================================================== */
/* CLOCK: orologio in topbar */
/* ===================================================== */

function updateClock() {
    const now = new Date();
    setText("systemClock", now.toLocaleTimeString());
}

/* ===================================================== */
/* WINDOW MANAGER: apri, minimizza, porta avanti e trascina */
/* ===================================================== */

function initializeWindowManager() {
    document.querySelectorAll("[data-open-window]").forEach(button => {
        button.addEventListener("click", () => {
            openWindow(button.dataset.openWindow);
            hideSystemMenu();
        });
    });

    document.querySelectorAll("[data-quick-action]").forEach(button => {
        button.addEventListener("click", () => {
            runQuickAction(button.dataset.quickAction);
        });
    });

    document.querySelectorAll("[data-minimize]").forEach(button => {
        button.addEventListener("click", event => {
            event.stopPropagation();
            minimizeOsWindow(button.dataset.minimize);
        });
    });

    document.querySelectorAll("[data-maximize]").forEach(button => {
        button.addEventListener("click", event => {
            event.stopPropagation();
            maximizeOsWindow(button.dataset.maximize);
        });
    });

    document.querySelectorAll(".os-window").forEach(windowElement => {
        windowElement.addEventListener("mousedown", () => {
            focusWindow(windowElement.id);
        });

        ensureResizeGrip(windowElement);
    });

    document.querySelectorAll(".window-bar").forEach(bar => {
        bar.addEventListener("mousedown", startWindowDrag);
        bar.addEventListener("dblclick", event => {
            const windowElement = event.currentTarget.closest(".os-window");

            if (windowElement) {
                maximizeOsWindow(windowElement.id);
            }
        });
    });

    document.getElementById("systemMenuButton").addEventListener("click", event => {
        event.stopPropagation();
        toggleSystemMenu();
    });
    document.getElementById("unlockButton")?.addEventListener("click", unlockSession);
    document.addEventListener("click", event => {
        const menu = document.getElementById("systemMenu");
        const button = document.getElementById("systemMenuButton");

        if (!menu || menu.classList.contains("hidden")) {
            return;
        }

        if (!menu.contains(event.target) && !button?.contains(event.target)) {
            hideSystemMenu();
        }
    });
    window.addEventListener("resize", clampAllWindowsToSafeArea);
    window.addEventListener("resize", positionSystemMenu);
    window.addEventListener("keydown", handleWindowKeyboardMove);
}

function openWindow(windowId, options = {}) {
    const windowElement = document.getElementById(windowId);

    if (!windowElement) {
        return;
    }


    windowElement.classList.remove("hidden-window");
    clampWindowToSafeArea(windowElement);
    focusWindow(windowId);


    playWindowZoom(windowElement);
    renderTaskbar();
    renderOverview();

    if (windowId === "accountAdminWindow") {
        refreshAccountUsers();
    }

    if (!options.skipLaunchScript) {
        playLaunchZoom(windowElement.dataset.windowTitle || windowId);
    }
}

/* ===================================================== */
/* QUICK ACTIONS: comandi globali del control center */
/* ===================================================== */

function runQuickAction(action) {
    switch (action) {
        case "replayBoot":
            replayBootSequence();
            break;
        case "focusMode":
            toggleFocusMode();
            break;
        case "cinematicLayout":
            applyDisplayProfile();
            hideSystemMenu();
            break;
        case "cleanDesktop":
            cleanDesktop();
            break;
        case "systemSnapshot":
            copySystemSnapshot();
            break;
        case "cycleTheme":
            cycleTheme();
            break;
        case "boostMode":
            toggleBoostMode();
            break;
        case "govVisualProfile":
            restoreGovVisualProfile();
            break;
        case "visualCleanup":
            clearVisualCaches();
            break;
        case "sessionBrief":
            createSessionBrief();
            break;
        case "securitySweep":
            runSecuritySweep();
            break;
        case "lockScreen":
            lockSession();
            break;
        default:
            showToast("Action unavailable", action || "unknown", "warn");
    }
}

function scheduleRenderOverview() {
    if (overviewRenderQueued) {
        return;
    }

    overviewRenderQueued = true;
    requestAnimationFrame(() => {
        overviewRenderQueued = false;
        renderOverview();
    });
}

function toggleFocusMode(force) {
    const enabled = typeof force === "boolean"
        ? force
        : !document.body.classList.contains("focus-mode");

    document.body.classList.toggle("focus-mode", enabled);
    showToast("Focus mode", enabled ? "Dock and film panels muted" : "Full interface restored");
    appendTerminal(`Focus mode ${enabled ? "enabled" : "disabled"}.`);
    hideSystemMenu();
}

function cleanDesktop() {
    document.querySelectorAll(".os-window").forEach(windowElement => {
        windowElement.classList.add("hidden-window");
        windowElement.classList.remove("active-window");
    });

    const overview = document.getElementById("overviewWindow");

    if (overview) {
        applyProfileGeometry(overview, { id: "overviewWindow", left: 96, top: 54, width: 860, height: 620 });
        openWindow("overviewWindow", { skipLaunchScript: true });
    }

    setText("overviewStatus", `CLEAN DESKTOP :: v${APP_VERSION} :: ready`);
    renderTaskbar();
    renderOverview();
    showToast("Clean desktop", "Overview is now the only open window");
    appendTerminal("Clean desktop applied.");
    hideSystemMenu();
}

async function copySystemSnapshot() {
    const snapshot = [
        `CyberDesk v${APP_VERSION}`,
        `Operator: ${settings.operator}`,
        `Theme: ${settings.theme}`,
        `Performance: ${settings.performanceMode}${isLitePerformance() ? " / lite" : ""}`,
        `Startup: ${settings.startupMode}`,
        `Host: ${latestSystemInfo?.hostname || "unknown"}`,
        `CPU: ${latestSystemInfo?.cpu ?? "--"}%`,
        `RAM: ${latestSystemInfo?.ram ?? "--"}% of ${latestSystemInfo?.totalRam || "--"} GB`,
        `Local IP: ${latestSystemInfo?.ip || "unknown"}`,
        `Adapters: ${latestNetworkInfo.length}`,
        `WSL: ${terminalOnline ? "online" : terminalStarting ? "starting" : "offline"}`,
        `Update: ${updateStatus?.status || "idle"}`
    ].join("\n");

    try {
        await navigator.clipboard.writeText(snapshot);
        showToast("Snapshot copied", `CyberDesk v${APP_VERSION}`);
    } catch {
        showToast("Snapshot ready", "Clipboard unavailable", "warn");
    }

    appendTerminal(snapshot);
    hideSystemMenu();
}

function cycleTheme() {
    const themes = Object.keys(THEME_PRESETS);
    const nextIndex = (themes.indexOf(settings.theme) + 1) % themes.length;

    settings.theme = themes[nextIndex] || DEFAULT_SETTINGS.theme;
    persistSettings();
    applySettings();
    showToast("Theme changed", settings.theme);
    appendTerminal(`Theme changed: ${settings.theme}.`);
    hideSystemMenu();
}

function toggleBoostMode() {
    settings.performanceMode = settings.performanceMode === "lite" ? "auto" : "lite";
    persistSettings();
    applySettings();
    showToast("Boost mode", settings.performanceMode === "lite" ? "Lite profile enabled" : "Auto profile restored");
    appendTerminal(`Performance mode: ${settings.performanceMode}.`);
    hideSystemMenu();
}

function restoreGovVisualProfile() {
    settings.systemLabel = DEFAULT_SETTINGS.systemLabel;
    settings.theme = DEFAULT_SETTINGS.theme;
    settings.scanline = DEFAULT_SETTINGS.scanline;
    settings.performanceMode = DEFAULT_SETTINGS.performanceMode;
    settings.autoLockMinutes = DEFAULT_SETTINGS.autoLockMinutes;
    settings.startupMode = DEFAULT_SETTINGS.startupMode;
    settings.visualRevision = DEFAULT_SETTINGS.visualRevision;
    document.body.classList.remove("focus-mode", "performance-lite", "scanline-off");
    persistSettings();
    applySettings();
    resetAutoLockTimer();
    applyDisplayProfile();
    showToast("Gov visual profile", "Official CyberDesk GOV OPS look restored");
    appendTerminal(`Gov visual profile restored: green theme, cinematic boot, stable visuals, v${APP_VERSION}.`);
    hideSystemMenu();
}

function clearVisualCaches() {
    document.body.classList.add("performance-lite");
    setTimeout(() => {
        document.body.classList.toggle("performance-lite", isLitePerformance());
    }, 2500);

    showToast("GPU cleanup", "Heavy visual effects were refreshed");
    appendTerminal("GPU cleanup: lightweight visual mode pulsed and compositor state refreshed.");
    hideSystemMenu();
}

function createSessionBrief() {
    const brief = [
        `CyberDesk v${APP_VERSION} session brief`,
        `Operator: ${settings.operator}`,
        `Mode: ${settings.startupMode} / ${settings.performanceMode}${isLitePerformance() ? " / lite" : ""}`,
        `Host: ${latestSystemInfo?.hostname || "unknown"} (${latestSystemInfo?.ip || "no local ip"})`,
        `CPU/RAM: ${latestSystemInfo?.cpu ?? "--"}% / ${latestSystemInfo?.ram ?? "--"}%`,
        `Open windows: ${document.querySelectorAll(".os-window:not(.hidden-window)").length}`,
        `Shell: ${getShellLabel(activeShellMode)} (${terminalOnline ? "online" : terminalStarting ? "starting" : "offline"})`,
        `Network adapters: ${latestNetworkInfo.length}`,
        `Notes: ${logbookEntries.length} / Database records: ${databaseEntries.length}`,
        `Last command: ${commandHistory.at(-1) || "none"}`
    ].join("\n");

    logbookEntries.unshift({
        id: `note-${Date.now()}`,
        text: brief,
        tags: ["brief", "session"],
        createdAt: new Date().toISOString()
    });
    logbookEntries = logbookEntries.slice(0, 80);
    persistLogbookEntries();
    renderLogbook();
    renderOverview();
    appendTerminal(brief);
    showToast("Session brief", "Saved to Logbook");
    hideSystemMenu();
}

/* SECURITY SWEEP: controllo rapido scenografico ma basato su dati reali locali. */
function runSecuritySweep() {
    const cpu = Number(latestSystemInfo?.cpu || 0);
    const ram = Number(latestSystemInfo?.ram || 0);
    const adapters = latestNetworkInfo.length;
    const openWindows = document.querySelectorAll(".os-window:not(.hidden-window)").length;
    const terminalState = terminalOnline ? "online" : terminalStarting ? "starting" : "offline";
    const score = [
        cpu >= 88 ? 2 : cpu >= 70 ? 1 : 0,
        ram >= 86 ? 2 : ram >= 70 ? 1 : 0,
        adapters === 0 ? 1 : 0,
        terminalState === "offline" ? 1 : 0,
        openWindows >= 7 ? 1 : 0
    ].reduce((sum, value) => sum + value, 0);
    const risk = score >= 4 ? "red watch" : score >= 2 ? "amber watch" : "green";
    const tone = score >= 4 ? "danger" : score >= 2 ? "warn" : "normal";
    const directive = score >= 4
        ? "reduce load / inspect network"
        : score >= 2
            ? "monitor resources"
            : "workspace clean";
    const summary = [
        `Security sweep :: ${risk.toUpperCase()}`,
        `CPU ${cpu || "--"}% / RAM ${ram || "--"}%`,
        `Adapters ${adapters} / WSL ${terminalState}`,
        `Open windows ${openWindows} / Records ${databaseEntries.length}`,
        `Directive: ${directive}`
    ].join("\n");

    securitySweepState = {
        status: "complete",
        risk,
        tone,
        lastRun: new Date().toLocaleTimeString(),
        directive
    };

    appendTerminal(summary, tone === "danger" ? "warn" : "prompt");
    showToast("Security sweep", risk.toUpperCase(), tone === "danger" ? "warn" : tone);
    renderOverview();
    hideSystemMenu();
}

/* SESSION LOCK: blocco manuale o automatico dopo inattivita. */
function lockSession(reason = "manual") {
    const overlay = document.getElementById("lockOverlay");

    if (!overlay) {
        return;
    }

    clearTimeout(autoLockTimer);
    autoLockTimer = null;
    setText("lockReason", reason === "auto" ? "AUTO LOCK / INACTIVITY TIMER" : "MANUAL LOCK / LOCAL CONSOLE");
    overlay.classList.remove("hidden");
    requestAnimationFrame(() => overlay.classList.add("is-visible"));
    document.body.classList.add("session-locked");
    showToast("Session locked", reason === "auto" ? "Auto lock after inactivity" : "Workspace hidden");
    hideSystemMenu();
}

function unlockSession() {
    const overlay = document.getElementById("lockOverlay");

    overlay?.classList.remove("is-visible");
    setTimeout(() => overlay?.classList.add("hidden"), 260);
    document.body.classList.remove("session-locked");
    resetAutoLockTimer();
    showToast("Session unlocked", "Workspace restored");
}

function initializeAutoLock() {
    const activityEvents = ["pointerdown", "mousemove", "keydown", "wheel", "touchstart"];

    activityEvents.forEach(eventName => {
        window.addEventListener(eventName, noteUserActivity, { passive: true });
    });

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            resetAutoLockTimer();
        }
    });

    resetAutoLockTimer();
}

function noteUserActivity() {
    const now = Date.now();

    if (now - lastActivityTick < 1200) {
        return;
    }

    lastActivityTick = now;
    resetAutoLockTimer();
}

function resetAutoLockTimer() {
    lastActivityAt = Date.now();
    clearTimeout(autoLockTimer);
    autoLockTimer = null;

    const minutes = normalizeAutoLockMinutes(settings.autoLockMinutes);

    if (!minutes || document.body.classList.contains("session-locked")) {
        setText("lockAutoTimer", minutes ? `${minutes} min` : "off");
        return;
    }

    setText("lockAutoTimer", `${minutes} min`);
    autoLockTimer = setTimeout(() => {
        if (!document.body.classList.contains("session-locked")) {
            lockSession("auto");
        }
    }, minutes * 60 * 1000);
}

function minimizeOsWindow(windowId) {
    const windowElement = document.getElementById(windowId);

    if (windowElement) {
        windowElement.classList.add("hidden-window");
        renderTaskbar();
        renderOverview();
    }
}

function maximizeOsWindow(windowId) {
    const windowElement = document.getElementById(windowId);

    if (!windowElement) {
        return;
    }

    focusWindow(windowId);

    if (windowElement.dataset.maximized === "true") {
        restoreWindowGeometry(windowElement);
        return;
    }

    saveWindowGeometry(windowElement);

    const desktopStage = document.querySelector(".desktop-stage");
    const safeBounds = getWindowSafeBounds(desktopStage);
    const width = Math.max(360, safeBounds.right - safeBounds.left);
    const height = Math.max(260, safeBounds.bottom - safeBounds.top);

    windowElement.dataset.maximized = "true";
    windowElement.classList.add("maximized-window");
    windowElement.style.left = `${safeBounds.left}px`;
    windowElement.style.top = `${safeBounds.top}px`;
    windowElement.style.right = "auto";
    windowElement.style.bottom = "auto";
    windowElement.style.width = `${width}px`;
    windowElement.style.height = `${height}px`;
}

function saveWindowGeometry(windowElement) {
    windowElement.dataset.restoreLeft = `${windowElement.offsetLeft}px`;
    windowElement.dataset.restoreTop = `${windowElement.offsetTop}px`;
    windowElement.dataset.restoreWidth = `${windowElement.offsetWidth}px`;
    windowElement.dataset.restoreHeight = `${windowElement.offsetHeight}px`;
}

function restoreWindowGeometry(windowElement) {
    windowElement.dataset.maximized = "false";
    windowElement.classList.remove("maximized-window");
    windowElement.style.left = windowElement.dataset.restoreLeft || `${windowElement.offsetLeft}px`;
    windowElement.style.top = windowElement.dataset.restoreTop || `${windowElement.offsetTop}px`;
    windowElement.style.width = windowElement.dataset.restoreWidth || `${windowElement.offsetWidth}px`;
    windowElement.style.height = windowElement.dataset.restoreHeight || `${windowElement.offsetHeight}px`;
    windowElement.style.right = "auto";
    windowElement.style.bottom = "auto";
    clampWindowToSafeArea(windowElement);
}

function focusWindow(windowId) {
    const windowElement = document.getElementById(windowId);

    if (!windowElement) {
        return;
    }

    if (zIndexCounter >= WINDOW_Z_INDEX_MAX) {
        normalizeWindowZIndexes();
    }

    zIndexCounter++;

    document.querySelectorAll(".os-window").forEach(item => {
        item.classList.remove("active-window");
    });

    windowElement.classList.add("active-window");
    windowElement.style.zIndex = String(zIndexCounter);
    setText("activeWindowLabel", windowElement.dataset.windowTitle || "cyberdesk");
    renderTaskbar();
    renderOverview();
}

function normalizeWindowZIndexes() {
    const windows = Array.from(document.querySelectorAll(".os-window"))
        .sort((left, right) => Number(left.style.zIndex || WINDOW_Z_INDEX_BASE) - Number(right.style.zIndex || WINDOW_Z_INDEX_BASE));

    windows.forEach((windowElement, index) => {
        windowElement.style.zIndex = String(WINDOW_Z_INDEX_BASE + index);
    });

    zIndexCounter = WINDOW_Z_INDEX_BASE + windows.length;
}

/* WINDOW SAFE AREA: confini interni per non coprire dock e taskbar. */
function getWindowSafeBounds(stage = document.querySelector(".desktop-stage")) {
    const margin = 10;
    const topMargin = 42;
    const fallbackWidth = stage?.clientWidth || window.innerWidth;
    const fallbackHeight = stage?.clientHeight || window.innerHeight;
    const dock = document.querySelector(".dock");
    const taskbar = document.getElementById("windowTaskbar");
    let right = fallbackWidth - margin;
    let bottom = fallbackHeight - margin;

    if (stage && dock && !dock.classList.contains("hidden")) {
        const dockStyle = getComputedStyle(dock);
        const dockIsVisible = dockStyle.display !== "none" && dock.offsetWidth > 0 && dock.offsetHeight > 0;
        const dockIsHorizontal = dockIsVisible && (dock.offsetWidth > dock.offsetHeight || window.innerWidth <= 760);

        if (dockIsHorizontal) {
            bottom = Math.min(bottom, Math.max(topMargin + 240, dock.offsetTop - margin));
        } else if (dockIsVisible) {
            right = Math.min(right, Math.max(margin, dock.offsetLeft - margin));
        }
    }

    if (stage && taskbar && getComputedStyle(taskbar).display !== "none") {
        bottom = Math.min(bottom, Math.max(topMargin + 240, taskbar.offsetTop - margin));
    }

    return {
        left: margin,
        top: topMargin,
        right,
        bottom
    };
}

function clamp(value, min, max) {
    if (max < min) {
        return min;
    }

    return Math.min(Math.max(value, min), max);
}

function clampWindowToSafeArea(windowElement) {
    if (!windowElement || windowElement.classList.contains("hidden-window")) {
        return;
    }

    const safeBounds = getWindowSafeBounds();
    const minWidth = Number(windowElement.dataset.minWidth || 320);
    const minHeight = Number(windowElement.dataset.minHeight || 210);
    const maxWidth = Math.max(minWidth, safeBounds.right - safeBounds.left);
    const maxHeight = Math.max(minHeight, safeBounds.bottom - safeBounds.top);
    const width = clamp(windowElement.offsetWidth || minWidth, minWidth, maxWidth);
    const height = clamp(windowElement.offsetHeight || minHeight, minHeight, maxHeight);
    const left = clamp(windowElement.offsetLeft, safeBounds.left, safeBounds.right - width);
    const top = clamp(windowElement.offsetTop, safeBounds.top, safeBounds.bottom - height);

    windowElement.style.left = `${left}px`;
    windowElement.style.top = `${top}px`;
    windowElement.style.right = "auto";
    windowElement.style.bottom = "auto";
    windowElement.style.width = `${width}px`;
    windowElement.style.height = `${height}px`;
}

function clampAllWindowsToSafeArea() {
    document.querySelectorAll(".os-window:not(.hidden-window)").forEach(clampWindowToSafeArea);
}

function playWindowZoom(windowElement) {
    windowElement.classList.remove("zoom-open");
    void windowElement.offsetWidth;
    windowElement.classList.add("zoom-open");

    setTimeout(() => {
        windowElement.classList.remove("zoom-open");
    }, isLitePerformance() ? 240 : 420);
}

function playLaunchZoom(label) {
    document.querySelectorAll(".launch-zoom-pulse").forEach(item => item.remove());
}

function buildLaunchScript(label, frame, compact = false) {
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "module";
    const lines = [
        `root@cyberdesk:~$ cyberdesk-open "${label}" ${compact ? "--fast" : "--cinematic"}`,
        `session=${randomHex(12)} frame=${String(frame).padStart(2, "0")} z-index=${zIndexCounter}`
    ];

    const commandCount = compact ? 3 : 7;

    for (let index = 0; index < commandCount; index++) {
        const command = LAUNCH_SCRIPT_COMMANDS[(frame + index) % LAUNCH_SCRIPT_COMMANDS.length]
            .replaceAll("{target}", label)
            .replaceAll("{slug}", slug)
            .replaceAll("{hex}", randomHex(8));

        lines.push(`  ${command}`);
    }

    lines.push("status: READY :: window compositor attached");
    return lines.join("\n");
}

function sanitizeLaunchLabel(label) {
    return String(label || "module")
        .replace(/[^a-zA-Z0-9 ._/-]/g, "")
        .trim()
        .slice(0, 42) || "module";
}

function randomHex(length) {
    const alphabet = "0123456789abcdef";
    let output = "";

    for (let index = 0; index < length; index++) {
        output += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    return output;
}

function applyDisplayProfile() {
    document.body.dataset.displayRole = DISPLAY_ROLE;
    document.body.dataset.displayIndex = String(DISPLAY_INDEX);

    const profile = buildDisplayProfile(DISPLAY_ROLE);

    document.querySelectorAll(".os-window").forEach(windowElement => {
        windowElement.classList.add("hidden-window");
        windowElement.classList.remove("active-window");
    });

    profile.forEach(item => {
        const windowElement = document.getElementById(item.id);

        if (!windowElement) {
            return;
        }

        applyProfileGeometry(windowElement, item);
        openWindow(item.id, { skipLaunchScript: true });
    });

    focusWindow(profile[0]?.id || "overviewWindow");
    setText(
        "overviewStatus",
        `${DISPLAY_ROLE.toUpperCase()} DISPLAY ${DISPLAY_INDEX + 1}/${DISPLAY_TOTAL} :: authorized local workspace`
    );
    appendTerminal(`Display profile loaded: ${DISPLAY_ROLE} (${DISPLAY_INDEX + 1}/${DISPLAY_TOTAL}).`);
}

function buildDisplayProfile(role) {
    const safeBounds = getWindowSafeBounds();
    const gap = 22;
    const usableWidth = Math.max(320, safeBounds.right - safeBounds.left);
    const left = safeBounds.left + (usableWidth >= 960 ? 62 : 0);
    const top = safeBounds.top + 10;
    const width = Math.max(320, safeBounds.right - left - 18);
    const height = Math.max(260, safeBounds.bottom - top - 18);
    const wide = width >= 1500;

    if (width < 980) {
        const stackGap = Math.min(gap, 14);
        const stackHeight = Math.max(220, Math.floor((height - stackGap) / 2));

        return [
            { id: "overviewWindow", left, top, width, height: stackHeight },
            { id: "monitorWindow", left, top: top + stackHeight + stackGap, width, height: stackHeight }
        ];
    }

    if (role === "dashboard") {
        const sideWidth = wide ? clamp(Math.round(width * 0.28), 420, 560) : 410;
        const mainWidth = width - sideWidth - gap;
        const lowerTop = top + Math.round(height * 0.58) + gap;
        const lowerHeight = Math.max(240, safeBounds.bottom - lowerTop - 16);

        return [
            { id: "networkWindow", left, top, width: mainWidth, height: Math.round(height * 0.58) },
            { id: "wslGuideWindow", left, top: lowerTop, width: mainWidth, height: lowerHeight },
            { id: "monitorWindow", left: left + mainWidth + gap, top, width: sideWidth, height: Math.round(height * 0.44) },
            { id: "launcherWindow", left: left + mainWidth + gap, top: top + Math.round(height * 0.44) + gap, width: sideWidth, height: Math.max(250, height - Math.round(height * 0.44) - gap) }
        ];
    }

    if (role === "ops") {
        const leftWidth = wide ? clamp(Math.round(width * 0.48), 700, 880) : 680;
        const rightWidth = width - leftWidth - gap;
        const terminalHeight = Math.round(height * 0.48);

        return [
            { id: "terminalWindow", left, top, width: leftWidth, height: terminalHeight },
            { id: "opsWindow", left, top: top + terminalHeight + gap, width: leftWidth, height: Math.max(270, height - terminalHeight - gap) },
            { id: "wslGuideWindow", left: left + leftWidth + gap, top, width: rightWidth, height: Math.round(height * 0.68) },
            { id: "databaseWindow", left: left + leftWidth + gap, top: top + Math.round(height * 0.68) + gap, width: rightWidth, height: Math.max(220, height - Math.round(height * 0.68) - gap) }
        ];
    }

    const firstWidth = wide
        ? clamp(Math.round(width * 0.42), 720, 860)
        : clamp(Math.round((width - gap) * 0.52), 500, 660);
    const secondWidth = wide
        ? clamp(Math.round(width * 0.27), 430, 540)
        : Math.max(320, width - firstWidth - gap);
    const thirdWidth = width - firstWidth - secondWidth - (gap * 2);
    const topHeight = Math.round(height * 0.56);
    const bottomTop = top + topHeight + gap;
    const bottomHeight = Math.max(240, height - topHeight - gap);
    const profile = [
        { id: "overviewWindow", left, top, width: firstWidth, height: topHeight },
        { id: "terminalWindow", left, top: bottomTop, width: firstWidth, height: bottomHeight },
        { id: "monitorWindow", left: left + firstWidth + gap, top, width: secondWidth, height: topHeight },
        { id: "databaseWindow", left: left + firstWidth + gap, top: bottomTop, width: secondWidth, height: bottomHeight }
    ];

    if (wide && thirdWidth >= 360) {
        profile.push({
            id: "networkWindow",
            left: left + firstWidth + secondWidth + (gap * 2),
            top,
            width: thirdWidth,
            height
        });
    }

    return profile;
}

function applyProfileGeometry(windowElement, geometry) {
    const stage = document.querySelector(".desktop-stage");
    const safeBounds = getWindowSafeBounds(stage);
    const minWidth = Number(windowElement.dataset.minWidth || 320);
    const minHeight = Number(windowElement.dataset.minHeight || 210);
    const left = clamp(geometry.left, safeBounds.left, safeBounds.right - minWidth);
    const top = clamp(geometry.top, safeBounds.top, safeBounds.bottom - minHeight);
    const maxWidth = Math.max(minWidth, safeBounds.right - left);
    const maxHeight = Math.max(minHeight, safeBounds.bottom - top);

    windowElement.dataset.maximized = "false";
    windowElement.classList.remove("maximized-window");
    windowElement.style.left = `${left}px`;
    windowElement.style.top = `${top}px`;
    windowElement.style.right = "auto";
    windowElement.style.bottom = "auto";
    windowElement.style.width = `${Math.min(geometry.width, maxWidth)}px`;
    windowElement.style.height = `${Math.min(geometry.height, maxHeight)}px`;
}

const LAYOUT_PRESETS = {
    command: [
        { id: "terminalWindow", left: 92, top: 46, width: 760, height: 430 },
        { id: "wslGuideWindow", left: 882, top: 46, width: 540, height: 430 },
        { id: "logbookWindow", left: 92, top: 506, width: 610, height: 310 },
        { id: "databaseWindow", left: 732, top: 506, width: 500, height: 310 }
    ],
    network: [
        { id: "networkWindow", left: 92, top: 46, width: 650, height: 380 },
        { id: "monitorWindow", left: 772, top: 46, width: 430, height: 380 },
        { id: "terminalWindow", left: 92, top: 456, width: 650, height: 360 },
        { id: "searchWindow", left: 772, top: 456, width: 560, height: 360 }
    ],
    lab: [
        { id: "overviewWindow", left: 92, top: 46, width: 620, height: 460 },
        { id: "labWindow", left: 742, top: 46, width: 430, height: 360 },
        { id: "opsWindow", left: 92, top: 536, width: 700, height: 330 },
        { id: "terminalWindow", left: 822, top: 436, width: 600, height: 350 }
    ]
};

function applyNamedLayout(name) {
    const customLayouts = loadCustomLayouts();
    const layout = LAYOUT_PRESETS[name] || customLayouts[name];

    if (!layout) {
        showToast("Layout missing", `${name} has not been saved yet`, "warn");
        return;
    }

    document.querySelectorAll(".os-window").forEach(windowElement => {
        windowElement.classList.add("hidden-window");
        windowElement.classList.remove("active-window");
    });

    layout.forEach(item => {
        const windowElement = document.getElementById(item.id);

        if (!windowElement) {
            return;
        }

        applyProfileGeometry(windowElement, item);
        openWindow(item.id, { skipLaunchScript: true });
    });

    focusWindow(layout[0]?.id || "overviewWindow");
    showToast("Layout loaded", name);
}

function saveCurrentLayout(name = "custom") {
    const layout = Array.from(document.querySelectorAll(".os-window:not(.hidden-window)"))
        .map(windowElement => ({
            id: windowElement.id,
            left: windowElement.offsetLeft,
            top: windowElement.offsetTop,
            width: windowElement.offsetWidth,
            height: windowElement.offsetHeight
        }));

    if (!layout.length) {
        showToast("Layout not saved", "No visible windows", "warn");
        return;
    }

    const customLayouts = loadCustomLayouts();
    customLayouts[name] = layout;
    persistCustomLayouts(customLayouts);
    showToast("Layout saved", name);
}

/* ===================================================== */
/* V2 SHELL: taskbar, command palette, overview e logbook */
/* ===================================================== */

function showToast(title, message = "", tone = "info") {
    const stack = document.getElementById("toastStack");

    if (!stack) {
        return;
    }

    const toast = document.createElement("article");
    const id = `toast-${Date.now()}-${toastCounter++}`;

    toast.className = "toast";
    toast.dataset.tone = tone;
    toast.dataset.toastId = id;
    toast.innerHTML = `
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(message)}</span>
    `;
    stack.prepend(toast);

    while (stack.children.length > 4) {
        stack.lastElementChild.remove();
    }

    setTimeout(() => {
        toast.classList.add("toast-out");
        setTimeout(() => toast.remove(), 180);
    }, isLitePerformance() ? 2200 : 3600);
}

function initializeV2Shell() {
    const paletteInput = document.getElementById("paletteInput");
    const launcherSearch = document.getElementById("launcherSearch");
    const logbookForm = document.getElementById("logbookForm");
    const logbookSearch = document.getElementById("logbookSearch");
    const databaseForm = document.getElementById("databaseForm");
    const databaseSearch = document.getElementById("databaseSearch");
    const databaseClearButton = document.getElementById("databaseClearButton");
    const databaseExportButton = document.getElementById("databaseExportButton");

    document.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            openCommandPalette();
            return;
        }

        if (event.key === "Escape") {
            closeCommandPalette();
        }
    });

    paletteInput?.addEventListener("input", () => renderCommandPalette());
    paletteInput?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            runPaletteCommand();
        }
    });

    launcherSearch?.addEventListener("input", event => {
        launcherSearchQuery = event.target.value.trim().toLowerCase();
        renderLaunchers();
    });

    logbookForm?.addEventListener("submit", event => {
        event.preventDefault();
        saveLogbookEntry();
    });

    logbookSearch?.addEventListener("input", event => {
        logbookSearchQuery = event.target.value.trim().toLowerCase();
        renderLogbook();
    });

    databaseForm?.addEventListener("submit", event => {
        event.preventDefault();
        saveDatabaseEntry();
    });

    databaseSearch?.addEventListener("input", event => {
        renderDatabase(event.target.value.trim());
    });

    databaseClearButton?.addEventListener("click", clearDatabase);
    databaseExportButton?.addEventListener("click", copyDatabaseJson);

    buildPaletteCommands();
    renderWslCommandDeck();
    renderTaskbar();
    renderLogbook();
    renderDatabase();
    renderOverview();
}

async function initializeDisplayModeSetting() {
    try {
        const config = await ipcRenderer.invoke("get-display-mode");

        displayMode = config.multiDisplay || "primary";
        updateFeedUrl = config.updateFeedUrl || "";
        setInputValue("settingDisplayMode", displayMode);
        setInputValue("settingUpdateFeed", updateFeedUrl);
        appendTerminal(`Display mode: ${displayMode} (${config.displayCount} monitor detected).`);
    } catch {
        displayMode = "primary";
        setInputValue("settingDisplayMode", displayMode);
    }
}

function buildPaletteCommands() {
    const windowCommands = Array.from(document.querySelectorAll(".os-window"))
        .map(windowElement => ({
            label: windowElement.dataset.windowTitle || windowElement.id,
            hint: "open window",
            run: () => openWindow(windowElement.id)
        }));
    const launcherCommands = getAllLaunchers().map(launcher => ({
        label: launcher.name,
        hint: `launch ${launcher.id}`,
        run: () => launchApp(launcher.id)
    }));
    const terminalCommands = [
        { label: "System fingerprint", hint: "terminal preset", run: () => runTerminalPreset("sys") },
        { label: "Network inventory", hint: "terminal preset", run: () => runTerminalPreset("net") },
        { label: "Process review", hint: "terminal preset", run: () => runTerminalPreset("process") },
        { label: "Ping localhost", hint: "terminal preset", run: () => runTerminalPreset("ping-local") },
        { label: "Start Kali WSL", hint: "terminal shell", run: () => startRealShell("wsl", true) },
        { label: "Start PowerShell", hint: "terminal shell", run: () => startRealShell("powershell", true) },
        { label: "Start CMD", hint: "terminal shell", run: () => startRealShell("cmd", true) },
        { label: "Stop terminal", hint: "terminal shell", run: () => stopRealShell() },
        ...WSL_COMMAND_GROUPS.flatMap(group => group.commands.map(([command, description]) => ({
            label: command,
            hint: `WSL: ${description}`,
            run: () => runKaliCommand(command)
        })))
    ];
    const layoutCommands = [
        { label: "Command layout", hint: "workspace layout", run: () => applyNamedLayout("command") },
        { label: "Network layout", hint: "workspace layout", run: () => applyNamedLayout("network") },
        { label: "Lab layout", hint: "workspace layout", run: () => applyNamedLayout("lab") },
        { label: "Replay boot sequence", hint: "visual action", run: () => replayBootSequence() },
        { label: "Toggle focus mode", hint: "visual action", run: () => toggleFocusMode() },
        { label: "Cinematic display profile", hint: "workspace layout", run: () => applyDisplayProfile() },
        { label: "Clean desktop", hint: "visual action", run: () => cleanDesktop() },
        { label: "Copy system snapshot", hint: "utility", run: () => copySystemSnapshot() },
        { label: "Cycle theme", hint: "visual action", run: () => cycleTheme() },
        { label: "Boost lite mode", hint: "performance", run: () => toggleBoostMode() },
        { label: "Restore Gov visual profile", hint: "visual repair", run: () => restoreGovVisualProfile() },
        { label: "GPU cleanup", hint: "performance", run: () => clearVisualCaches() },
        { label: "Create session brief", hint: "logbook", run: () => createSessionBrief() },
        { label: "Run security sweep", hint: "control room", run: () => runSecuritySweep() },
        { label: "Lock screen", hint: "privacy", run: () => lockSession() },
        { label: "Save layout", hint: "save current windows", run: () => saveCurrentLayout("custom") },
        { label: "Restore saved layout", hint: "workspace layout", run: () => applyNamedLayout("custom") }
    ];

    paletteCommands = [...windowCommands, ...launcherCommands, ...layoutCommands, ...terminalCommands];
}

function openCommandPalette() {
    buildPaletteCommands();

    const palette = document.getElementById("commandPalette");
    const input = document.getElementById("paletteInput");

    if (!palette || !input) {
        return;
    }

    palette.classList.remove("hidden-window");
    input.value = "";
    renderCommandPalette();
    input.focus();
}

function closeCommandPalette() {
    const palette = document.getElementById("commandPalette");

    if (palette) {
        palette.classList.add("hidden-window");
    }
}

function renderCommandPalette() {
    const input = document.getElementById("paletteInput");
    const results = document.getElementById("paletteResults");

    if (!input || !results) {
        return;
    }

    const query = input.value.trim().toLowerCase();
    const matches = paletteCommands
        .filter(command => {
            const haystack = `${command.label} ${command.hint}`.toLowerCase();

            return !query || haystack.includes(query);
        })
        .slice(0, 9);

    results.innerHTML = "";

    matches.forEach((command, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.paletteIndex = String(index);
        button.innerHTML = `
            <strong>${escapeHtml(command.label)}</strong>
            <span>${escapeHtml(command.hint)}</span>
        `;
        button.addEventListener("click", () => runPaletteCommand(index));
        results.appendChild(button);
    });

    if (!matches.length) {
        results.innerHTML = "<p>No command found.</p>";
    }

    results.dataset.matches = JSON.stringify(matches.map(command => paletteCommands.indexOf(command)));
}

function runPaletteCommand(index = 0) {
    const results = document.getElementById("paletteResults");

    if (!results) {
        return;
    }

    const indexes = JSON.parse(results.dataset.matches || "[]");
    const command = paletteCommands[indexes[index]];

    if (!command) {
        return;
    }

    closeCommandPalette();
    command.run();
}

function renderTaskbar() {
    const taskbar = document.getElementById("windowTaskbar");

    if (!taskbar) {
        return;
    }

    const windows = Array.from(document.querySelectorAll(".os-window"));
    taskbar.innerHTML = "";

    windows.forEach(windowElement => {
        const button = document.createElement("button");
        const isHidden = windowElement.classList.contains("hidden-window");
        const isActive = windowElement.classList.contains("active-window");

        button.type = "button";
        button.textContent = windowElement.dataset.windowTitle || windowElement.id;
        button.dataset.state = isHidden ? "minimized" : isActive ? "active" : "open";
        button.addEventListener("click", () => openWindow(windowElement.id));
        taskbar.appendChild(button);
    });
}

function renderWslCommandDeck() {
    const deck = document.getElementById("wslCommandDeck");

    if (!deck) {
        return;
    }

    deck.innerHTML = "";

    WSL_COMMAND_GROUPS.forEach(group => {
        const section = document.createElement("section");
        const heading = document.createElement("h3");

        heading.textContent = group.title;
        section.appendChild(heading);

        group.commands.forEach(([command, description]) => {
            const button = document.createElement("button");
            const code = document.createElement("code");
            const text = document.createElement("span");

            button.type = "button";
            code.textContent = command;
            text.textContent = description;
            button.append(code, text);
            button.addEventListener("click", () => {
                openWindow("terminalWindow", { skipLaunchScript: true });
                startRealShell("wsl", true);
                sendShellInput(command);
            });
            section.appendChild(button);
        });

        deck.appendChild(section);
    });
}

function renderOverview() {
    const windows = Array.from(document.querySelectorAll(".os-window"));
    const openWindows = windows.filter(item => !item.classList.contains("hidden-window")).length;

    setText("overviewOpenWindows", String(openWindows));
    setText("overviewNotesCount", String(logbookEntries.length));
    setText("overviewDatabaseCount", String(databaseEntries.length));
    setText("overviewTheme", settings.theme);
    setText("overviewPerformance", isLitePerformance() ? `${settings.performanceMode} / lite` : settings.performanceMode);
    setText("overviewProfile", settings.startupMode);
    setText("overviewVersion", `v${APP_VERSION}`);
    setText("overviewLastCommand", commandHistory.at(-1) || "none");
    setText("overviewUpdateState", updateStatus?.status || "idle");
    setText("overviewAdapters", String(latestNetworkInfo.length));
    setText("overviewWslStatus", terminalOnline ? "online" : terminalStarting ? "starting" : "offline");
    setText("overviewShellMode", getShellLabel(activeShellMode));
    setText("overviewSweepState", securitySweepState.status);
    setText("overviewSweepRisk", securitySweepState.risk);
    setText("overviewSweepLast", securitySweepState.lastRun);
    setText("overviewSweepDirective", securitySweepState.directive);
    setTone("overviewSweepRisk", securitySweepState.tone);

    if (latestSystemInfo) {
        setText("overviewRam", `${latestSystemInfo.ram}%`);
        setText("overviewHost", latestSystemInfo.hostname);
        setText("overviewIp", latestSystemInfo.ip);
        setText("overviewUptime", `${latestSystemInfo.uptime} min`);
        setText("overviewTotalRam", `${latestSystemInfo.totalRam} GB`);
        renderSystemCharts();
    }
}

/* SYSTEM CHARTS: gauge e barre usano solo DOM/CSS, quindi restano leggeri. */
function recordSystemSample(cpu, ram) {
    systemHistory.cpu.push(clampPercent(cpu));
    systemHistory.ram.push(clampPercent(ram));
    systemHistory.cpu = systemHistory.cpu.slice(-SYSTEM_HISTORY_LIMIT);
    systemHistory.ram = systemHistory.ram.slice(-SYSTEM_HISTORY_LIMIT);
}

function renderSystemCharts() {
    if (!latestSystemInfo) {
        return;
    }

    const cpu = clampPercent(latestSystemInfo.cpu);
    const ram = clampPercent(latestSystemInfo.ram);
    const cpuPeak = Math.max(0, ...systemHistory.cpu);
    const ramPeak = Math.max(0, ...systemHistory.ram);

    setGauge("cpuGauge", cpu);
    setGauge("ramGauge", ram);
    setGauge("overviewCpuGauge", cpu);
    setGauge("overviewRamGauge", ram);

    setText("overviewCpuDetail", `${latestSystemInfo.cpus || "--"} core / peak ${cpuPeak}%`);
    setText("overviewRamDetail", `${latestSystemInfo.usedRam || "--"} GB used of ${latestSystemInfo.totalRam || "--"} GB`);
    setText("overviewHistoryLabel", `${systemHistory.cpu.length}/${SYSTEM_HISTORY_LIMIT} samples`);
    setText("systemChartSummary", `${latestSystemInfo.hostname} / ${latestSystemInfo.ip}`);
    setText("cpuHistoryPeak", `peak ${cpuPeak}%`);
    setText("ramHistoryPeak", `peak ${ramPeak}%`);
    setText("cpuModelMetric", latestSystemInfo.cpuModel || "CPU");
    setText("cpuCoresMetric", String(latestSystemInfo.cpus || "--"));
    setText("ramUsedMetric", `${latestSystemInfo.usedRam ?? "--"} GB`);
    setText("ramFreeMetric", `${latestSystemInfo.freeRam ?? "--"} GB`);
    setText("uptimeMetric", `${latestSystemInfo.uptime ?? "--"} min`);

    renderSparkBars("cpuHistoryChart", systemHistory.cpu);
    renderSparkBars("ramHistoryChart", systemHistory.ram);
    renderDualSparkline("overviewSystemSparkline", systemHistory.cpu, systemHistory.ram);
}

function setGauge(id, value) {
    const gauge = document.getElementById(id);

    if (!gauge) {
        return;
    }

    const percent = clampPercent(value);
    gauge.style.setProperty("--value", String(percent));
    gauge.dataset.tone = percent >= 86 ? "danger" : percent >= 68 ? "warn" : "normal";

    const label = gauge.querySelector("strong");
    if (label) {
        label.textContent = `${percent}%`;
    }
}

function renderSparkBars(id, values) {
    const chart = document.getElementById(id);

    if (!chart) {
        return;
    }

    chart.innerHTML = "";
    values.forEach(value => {
        const bar = document.createElement("i");
        bar.style.height = `${Math.max(5, clampPercent(value))}%`;
        bar.title = `${clampPercent(value)}%`;
        chart.appendChild(bar);
    });
}

function renderDualSparkline(id, cpuValues, ramValues) {
    const chart = document.getElementById(id);

    if (!chart) {
        return;
    }

    chart.innerHTML = "";
    const samples = Math.max(cpuValues.length, ramValues.length);

    for (let index = 0; index < samples; index++) {
        const group = document.createElement("span");
        const cpu = document.createElement("i");
        const ram = document.createElement("b");

        cpu.style.height = `${Math.max(5, clampPercent(cpuValues[index] || 0))}%`;
        ram.style.height = `${Math.max(5, clampPercent(ramValues[index] || 0))}%`;
        group.append(cpu, ram);
        chart.appendChild(group);
    }
}

function renderProcessChart() {
    const processList = document.getElementById("processList");

    if (!processList) {
        return;
    }

    processList.innerHTML = "";

    if (!latestProcesses.length) {
        processList.innerHTML = "<p>Process data unavailable.</p>";
        return;
    }

    const maxRam = Math.max(1, ...latestProcesses.map(item => Number(item.RAM || 0)));

    latestProcesses.forEach(item => {
        const ram = Number(item.RAM || 0);
        const row = document.createElement("article");
        row.className = "process-chart-row";
        row.innerHTML = `
            <header>
                <span>${escapeHtml(item.ProcessName || "unknown")}</span>
                <strong>${escapeHtml(String(ram))} MB</strong>
            </header>
            <div class="process-bar"><i style="width: ${Math.max(4, Math.round(ram / maxRam * 100))}%"></i></div>
        `;
        processList.appendChild(row);
    });
}

function clampPercent(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.min(100, Math.max(0, Math.round(number)));
}

function saveDatabaseEntry() {
    const titleInput = document.getElementById("databaseTitle");
    const tagsInput = document.getElementById("databaseTags");
    const contentInput = document.getElementById("databaseContent");
    const content = contentInput?.value.trim();

    if (!content) {
        showToast("Database", "Record content is empty", "warn");
        return;
    }

    const entry = normalizeDatabaseEntry({
        title: titleInput?.value.trim() || content.slice(0, 64),
        tags: tagsInput?.value || "",
        content,
        createdAt: new Date().toISOString()
    });

    databaseEntries.unshift(entry);
    persistDatabaseEntries();
    titleInput.value = "";
    tagsInput.value = "";
    contentInput.value = "";
    renderDatabase();
    scheduleRenderOverview();
    showToast("Database", `Saved ${entry.id}`);
}

function renderDatabase(query = document.getElementById("databaseSearch")?.value.trim() || "") {
    const list = document.getElementById("databaseList");
    const status = document.getElementById("databaseStatus");

    if (!list) {
        return;
    }

    const results = searchDatabase(query);
    list.innerHTML = "";

    if (status) {
        status.textContent = `${results.length}/${databaseEntries.length} record(s)`;
    }

    if (!results.length) {
        list.innerHTML = "<p>No database record matched.</p>";
        return;
    }

    results.forEach(entry => {
        const card = document.createElement("article");
        const tags = entry.tags.length ? entry.tags.map(tag => `#${tag}`).join(" ") : "untagged";

        card.className = "database-card";
        card.innerHTML = `
            <header>
                <strong>${escapeHtml(entry.title)}</strong>
                <span>${escapeHtml(entry.id)}</span>
            </header>
            <p>${escapeHtml(entry.content)}</p>
            <small>${escapeHtml(tags)} :: ${escapeHtml(new Date(entry.updatedAt).toLocaleString())}</small>
            <div class="database-card-actions">
                <button type="button" data-db-copy="${escapeHtml(entry.id)}">Copy</button>
                <button type="button" data-db-delete="${escapeHtml(entry.id)}">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });

    list.querySelectorAll("[data-db-copy]").forEach(button => {
        button.addEventListener("click", () => copyDatabaseEntry(button.dataset.dbCopy));
    });
    list.querySelectorAll("[data-db-delete]").forEach(button => {
        button.addEventListener("click", () => deleteDatabaseEntry(button.dataset.dbDelete));
    });
}

function searchDatabase(query = "") {
    const clean = String(query || "").trim().toLowerCase();

    if (!clean) {
        return databaseEntries;
    }

    return databaseEntries.filter(entry => {
        const haystack = `${entry.id} ${entry.title} ${entry.tags.join(" ")} ${entry.content}`.toLowerCase();

        return clean.split(/\s+/).every(term => haystack.includes(term));
    });
}

async function copyDatabaseEntry(id) {
    const entry = databaseEntries.find(item => item.id === id);

    if (!entry) {
        return;
    }

    try {
        await navigator.clipboard.writeText(formatDatabaseEntry(entry));
        showToast("Database", "Record copied");
    } catch {
        showToast("Database", "Clipboard unavailable", "warn");
    }
}

function deleteDatabaseEntry(id) {
    databaseEntries = databaseEntries.filter(entry => entry.id !== id);
    persistDatabaseEntries();
    renderDatabase();
    scheduleRenderOverview();
    showToast("Database", "Record deleted");
}

function clearDatabase() {
    databaseEntries = [];
    persistDatabaseEntries();
    renderDatabase();
    scheduleRenderOverview();
    showToast("Database", "All records cleared");
}

async function copyDatabaseJson() {
    try {
        await navigator.clipboard.writeText(JSON.stringify(databaseEntries, null, 2));
        showToast("Database", "JSON copied");
    } catch {
        showToast("Database", "Clipboard unavailable", "warn");
    }
}

function formatDatabaseEntry(entry) {
    return [
        `[${entry.id}] ${entry.title}`,
        `tags: ${entry.tags.join(", ") || "none"}`,
        `updated: ${entry.updatedAt}`,
        "",
        entry.content
    ].join("\n");
}

function saveLogbookEntry() {
    const input = document.getElementById("logbookInput");
    const tagsInput = document.getElementById("logbookTags");
    const text = input?.value.trim();

    if (!text) {
        appendTerminal("Logbook entry is empty.", "warn");
        return;
    }

    logbookEntries.unshift({
        id: `note-${Date.now()}`,
        text,
        tags: parseTags(tagsInput?.value),
        createdAt: new Date().toISOString()
    });
    logbookEntries = logbookEntries.slice(0, 80);
    persistLogbookEntries();

    input.value = "";
    if (tagsInput) {
        tagsInput.value = "";
    }
    renderLogbook();
    renderOverview();
    appendTerminal("Logbook note saved.");
    showToast("Logbook", "Note saved");
}

function parseTags(value) {
    return String(value || "")
        .split(/[,\s]+/)
        .map(tag => tag.trim().toLowerCase().replace(/^#/, ""))
        .filter(Boolean)
        .slice(0, 8);
}

function renderLogbook() {
    const list = document.getElementById("logbookEntries");

    if (!list) {
        return;
    }

    list.innerHTML = "";
    const entries = logbookEntries.filter(entry => {
        if (!logbookSearchQuery) {
            return true;
        }

        const haystack = `${entry.text} ${(entry.tags || []).join(" ")}`.toLowerCase();

        return haystack.includes(logbookSearchQuery);
    });

    if (!entries.length) {
        list.innerHTML = "<p>No notes yet.</p>";
        return;
    }

    entries.forEach(entry => {
        const item = document.createElement("article");
        const date = new Date(entry.createdAt);
        const tags = Array.isArray(entry.tags) ? entry.tags : [];

        item.innerHTML = `
            <time>${escapeHtml(date.toLocaleString())}</time>
            <div class="logbook-tags">${tags.map(tag => `<span>#${escapeHtml(tag)}</span>`).join("")}</div>
            <p>${escapeHtml(entry.text)}</p>
            <button type="button" data-note-delete="${escapeHtml(entry.id)}">Delete</button>
        `;
        item.querySelector("[data-note-delete]")?.addEventListener("click", () => deleteLogbookEntry(entry.id));
        list.appendChild(item);
    });
}

function deleteLogbookEntry(id) {
    logbookEntries = logbookEntries.filter(entry => entry.id !== id);
    persistLogbookEntries();
    renderLogbook();
    renderOverview();
}

async function copyLogbookMarkdown() {
    const markdown = logbookEntries.map(entry => {
        const tags = Array.isArray(entry.tags) && entry.tags.length
            ? `\nTags: ${entry.tags.map(tag => `#${tag}`).join(" ")}`
            : "";

        return `## ${new Date(entry.createdAt).toLocaleString()}${tags}\n\n${entry.text}`;
    }).join("\n\n");

    try {
        await navigator.clipboard.writeText(markdown);
        showToast("Logbook copied", `${logbookEntries.length} note(s)`);
    } catch {
        appendTerminal("Clipboard unavailable.", "warn");
    }
}

function clearLogbook() {
    logbookEntries = [];
    persistLogbookEntries();
    renderLogbook();
    renderOverview();
    appendTerminal("Logbook cleared.");
    showToast("Logbook", "All notes cleared");
}

function startWindowDrag(event) {
    const windowElement = event.currentTarget.closest(".os-window");

    if (!windowElement || event.target.tagName === "BUTTON") {
        return;
    }

    event.preventDefault();

    if (windowElement.dataset.maximized === "true") {
        restoreWindowForDrag(windowElement, event);
    }

    focusWindow(windowElement.id);

    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = windowElement.offsetLeft;
    const startTop = windowElement.offsetTop;
    const safeBounds = getWindowSafeBounds();
    let latestX = startX;
    let latestY = startY;
    let animationFrame = null;

    document.body.classList.add("window-dragging");
    windowElement.classList.add("is-dragging");

    function applyDragMove() {
        const nextLeft = startLeft + latestX - startX;
        const nextTop = startTop + latestY - startY;
        const maxLeft = safeBounds.right - windowElement.offsetWidth;
        const maxTop = safeBounds.bottom - windowElement.offsetHeight;

        windowElement.style.left = `${clamp(nextLeft, safeBounds.left, maxLeft)}px`;
        windowElement.style.top = `${clamp(nextTop, safeBounds.top, maxTop)}px`;
        windowElement.style.right = "auto";
        windowElement.style.bottom = "auto";
        animationFrame = null;
    }

    function moveWindow(moveEvent) {
        latestX = moveEvent.clientX;
        latestY = moveEvent.clientY;

        if (!animationFrame) {
            animationFrame = requestAnimationFrame(applyDragMove);
        }
    }

    function stopDrag(stopEvent) {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            applyDragMove();
        }

        applyWindowSnap(windowElement, stopEvent);
        document.body.classList.remove("window-dragging");
        windowElement.classList.remove("is-dragging");
        window.removeEventListener("mousemove", moveWindow);
        window.removeEventListener("mouseup", stopDrag);
    }

    window.addEventListener("mousemove", moveWindow);
    window.addEventListener("mouseup", stopDrag);
}

function restoreWindowForDrag(windowElement, event) {
    const rect = windowElement.getBoundingClientRect();
    const stageRect = document.querySelector(".desktop-stage")?.getBoundingClientRect();
    const restoreWidth = parseInt(windowElement.dataset.restoreWidth || "620", 10);
    const restoreHeight = parseInt(windowElement.dataset.restoreHeight || "360", 10);
    const ratioX = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;
    const stageX = stageRect ? event.clientX - stageRect.left : event.clientX;

    windowElement.dataset.maximized = "false";
    windowElement.classList.remove("maximized-window");
    windowElement.style.width = `${restoreWidth}px`;
    windowElement.style.height = `${restoreHeight}px`;
    windowElement.style.left = `${stageX - restoreWidth * ratioX}px`;
    windowElement.style.top = `${getWindowSafeBounds().top}px`;
    windowElement.style.right = "auto";
    windowElement.style.bottom = "auto";
    clampWindowToSafeArea(windowElement);
}

function applyWindowSnap(windowElement, event) {
    if (!event || !windowElement) {
        return;
    }

    const safeBounds = getWindowSafeBounds();
    const stageRect = document.querySelector(".desktop-stage")?.getBoundingClientRect();
    const pointerX = stageRect ? event.clientX - stageRect.left : event.clientX;
    const pointerY = stageRect ? event.clientY - stageRect.top : event.clientY;
    const snapDistance = 30;

    if (pointerY <= safeBounds.top + snapDistance) {
        maximizeOsWindow(windowElement.id);
        return;
    }

    if (pointerX <= safeBounds.left + snapDistance) {
        snapWindowToSide(windowElement, "left");
        return;
    }

    if (pointerX >= safeBounds.right - snapDistance) {
        snapWindowToSide(windowElement, "right");
    }
}

function snapWindowToSide(windowElement, side) {
    const safeBounds = getWindowSafeBounds();
    const gap = 8;
    const width = Math.max(Number(windowElement.dataset.minWidth || 320), Math.floor((safeBounds.right - safeBounds.left - gap) / 2));
    const height = Math.max(Number(windowElement.dataset.minHeight || 210), safeBounds.bottom - safeBounds.top);
    const left = side === "left" ? safeBounds.left : safeBounds.right - width;

    saveWindowGeometry(windowElement);
    windowElement.dataset.maximized = "false";
    windowElement.classList.remove("maximized-window");
    windowElement.style.left = `${left}px`;
    windowElement.style.top = `${safeBounds.top}px`;
    windowElement.style.right = "auto";
    windowElement.style.bottom = "auto";
    windowElement.style.width = `${width}px`;
    windowElement.style.height = `${height}px`;
    focusWindow(windowElement.id);
}

function getFocusedWindow() {
    return document.querySelector(".os-window.active-window:not(.hidden-window)");
}

function moveFocusedWindowBy(deltaX, deltaY) {
    const windowElement = getFocusedWindow();

    if (!windowElement || windowElement.dataset.maximized === "true") {
        return;
    }

    const safeBounds = getWindowSafeBounds();
    const maxLeft = safeBounds.right - windowElement.offsetWidth;
    const maxTop = safeBounds.bottom - windowElement.offsetHeight;

    windowElement.style.left = `${clamp(windowElement.offsetLeft + deltaX, safeBounds.left, maxLeft)}px`;
    windowElement.style.top = `${clamp(windowElement.offsetTop + deltaY, safeBounds.top, maxTop)}px`;
    windowElement.style.right = "auto";
    windowElement.style.bottom = "auto";
}

function resizeFocusedWindowBy(deltaX, deltaY) {
    const windowElement = getFocusedWindow();

    if (!windowElement) {
        return;
    }

    if (windowElement.dataset.maximized === "true") {
        restoreWindowGeometry(windowElement);
    }

    const safeBounds = getWindowSafeBounds();
    const minWidth = Number(windowElement.dataset.minWidth || 320);
    const minHeight = Number(windowElement.dataset.minHeight || 210);
    const maxWidth = safeBounds.right - windowElement.offsetLeft;
    const maxHeight = safeBounds.bottom - windowElement.offsetTop;

    windowElement.style.width = `${clamp(windowElement.offsetWidth + deltaX, minWidth, maxWidth)}px`;
    windowElement.style.height = `${clamp(windowElement.offsetHeight + deltaY, minHeight, maxHeight)}px`;
}

function handleWindowKeyboardMove(event) {
    const activeElement = document.activeElement;
    const isTyping = activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName);

    if (isTyping || !event.altKey || !event.key.startsWith("Arrow")) {
        return;
    }

    event.preventDefault();

    const step = event.ctrlKey ? 72 : 24;
    const direction = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step]
    }[event.key];

    if (!direction) {
        return;
    }

    if (event.shiftKey) {
        resizeFocusedWindowBy(direction[0], direction[1]);
    } else {
        moveFocusedWindowBy(direction[0], direction[1]);
    }
}

function ensureResizeGrip(windowElement) {
    if (windowElement.querySelector(".resize-grip")) {
        return;
    }

    const grip = document.createElement("button");
    grip.type = "button";
    grip.className = "resize-grip";
    grip.title = "Resize window";
    grip.setAttribute("aria-label", "Resize window");
    grip.addEventListener("mousedown", startWindowResize);
    windowElement.appendChild(grip);
}

function startWindowResize(event) {
    event.preventDefault();
    event.stopPropagation();

    const windowElement = event.currentTarget.closest(".os-window");

    if (!windowElement) {
        return;
    }

    if (windowElement.dataset.maximized === "true") {
        restoreWindowGeometry(windowElement);
    }

    focusWindow(windowElement.id);
    clampWindowToSafeArea(windowElement);

    const desktopStage = document.querySelector(".desktop-stage");
    const safeBounds = getWindowSafeBounds(desktopStage);
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = windowElement.offsetWidth;
    const startHeight = windowElement.offsetHeight;
    const startLeft = windowElement.offsetLeft;
    const startTop = windowElement.offsetTop;
    const minWidth = Number(windowElement.dataset.minWidth || 320);
    const minHeight = Number(windowElement.dataset.minHeight || 210);

    function resizeWindow(moveEvent) {
        const maxWidth = safeBounds.right - startLeft;
        const maxHeight = safeBounds.bottom - startTop;
        const nextWidth = startWidth + moveEvent.clientX - startX;
        const nextHeight = startHeight + moveEvent.clientY - startY;

        windowElement.style.width = `${clamp(nextWidth, minWidth, maxWidth)}px`;
        windowElement.style.height = `${clamp(nextHeight, minHeight, maxHeight)}px`;
        windowElement.style.right = "auto";
        windowElement.style.bottom = "auto";
    }

    function stopResize() {
        window.removeEventListener("mousemove", resizeWindow);
        window.removeEventListener("mouseup", stopResize);
    }

    window.addEventListener("mousemove", resizeWindow);
    window.addEventListener("mouseup", stopResize);
}

function toggleSystemMenu() {
    const menu = document.getElementById("systemMenu");
    const button = document.getElementById("systemMenuButton");

    if (!menu) {
        return;
    }

    const willOpen = menu.classList.contains("hidden");
    menu.classList.toggle("hidden", !willOpen);
    button?.setAttribute("aria-expanded", String(willOpen));

    if (willOpen) {
        positionSystemMenu();
    }
}

function hideSystemMenu() {
    document.getElementById("systemMenu")?.classList.add("hidden");
    document.getElementById("systemMenuButton")?.setAttribute("aria-expanded", "false");
}

function positionSystemMenu() {
    const menu = document.getElementById("systemMenu");
    const button = document.getElementById("systemMenuButton");
    const stage = document.querySelector(".desktop-stage");

    if (!menu || !button || !stage || menu.classList.contains("hidden")) {
        return;
    }

    const buttonRect = button.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const left = clamp(buttonRect.left - stageRect.left, 8, Math.max(8, stageRect.width - menu.offsetWidth - 8));
    const top = clamp(buttonRect.bottom - stageRect.top + 4, 6, Math.max(6, stageRect.height - menu.offsetHeight - 8));

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
}

/* ===================================================== */
/* TERMINAL: console reale collegata a Kali WSL */
/* ===================================================== */

function initializeTerminal() {
    const form = document.getElementById("terminalForm");
    const input = document.getElementById("terminalInput");
    const filter = document.getElementById("terminalFilter");

    form.addEventListener("submit", event => {
        event.preventDefault();
        sendShellInput(input.value);
        input.value = "";
    });

    input.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
            event.preventDefault();
            clearTerminal();
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "c") {
            event.preventDefault();
            copyTerminalOutput();
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "v") {
            event.preventDefault();
            pasteIntoTerminal();
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            browseHistory(-1);
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            browseHistory(1);
        }
    });

    document.querySelectorAll("[data-shell-mode]").forEach(button => {
        button.addEventListener("click", () => {
            startRealShell(button.dataset.shellMode, true);
        });
    });

    document.getElementById("terminalRestartButton").addEventListener("click", () => {
        startRealShell(activeShellMode, true);
    });

    document.getElementById("terminalStopButton").addEventListener("click", stopRealShell);
    document.getElementById("terminalInterruptButton").addEventListener("click", interruptRealShell);
    document.getElementById("terminalClearButton").addEventListener("click", clearTerminal);
    document.getElementById("terminalPasteButton").addEventListener("click", pasteIntoTerminal);
    document.getElementById("terminalNewTabButton").addEventListener("click", createTerminalTab);
    document.getElementById("terminalCopyButton").addEventListener("click", copyTerminalOutput);
    document.getElementById("terminalNoteButton").addEventListener("click", saveTerminalOutputToLogbook);

    filter?.addEventListener("input", event => {
        terminalFilterQuery = event.target.value.trim().toLowerCase();
        renderTerminalOutput();
    });

    ipcRenderer.on("terminal-output", (event, payload) => {
        appendTerminalChunk(payload.data, payload.stream === "stderr" ? "warn" : "normal");
    });

    ipcRenderer.on("terminal-status", (event, payload) => {
        setTerminalStatus(payload);
    });

    renderTerminalTabs();
    renderTerminalOutput();
}

function terminalIntro() {
    appendTerminal("CyberDesk multi-shell terminal loaded.");
    appendTerminal("Modes: Kali WSL, Windows PowerShell, Windows CMD. Commands run locally on this PC.");
    appendTerminal("Local database: use db help, db add, db search, db show.");
    appendTerminal("Shell is idle. Click Kali WSL, PowerShell or CMD when you want to start one.");
}

function getActiveTerminalTab() {
    let tab = terminalTabs.find(item => item.id === activeTerminalTabId);

    if (!tab) {
        tab = terminalTabs[0];
        activeTerminalTabId = tab.id;
    }

    return tab;
}

function renderTerminalTabs() {
    const container = document.getElementById("terminalTabs");

    if (!container) {
        return;
    }

    container.innerHTML = "";
    terminalTabs.forEach(tab => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.active = String(tab.id === activeTerminalTabId);
        button.textContent = tab.name;
        button.addEventListener("click", () => switchTerminalTab(tab.id));
        container.appendChild(button);
    });
}

function renderTerminalOutput() {
    const output = document.getElementById("terminalOutput");
    const tab = getActiveTerminalTab();

    if (!output || !tab) {
        return;
    }

    output.innerHTML = "";
    const visibleLines = terminalFilterQuery
        ? tab.lines.filter(item => item.text.toLowerCase().includes(terminalFilterQuery))
        : tab.lines;

    visibleLines.forEach(item => appendTerminalLineToDom(item.text, item.tone, false));
    output.scrollTop = output.scrollHeight;
}

function appendTerminalLineToDom(message, tone = "normal", scroll = true) {
    const output = document.getElementById("terminalOutput");

    if (!output) {
        return;
    }

    if (terminalFilterQuery && !String(message).toLowerCase().includes(terminalFilterQuery)) {
        return;
    }

    const line = document.createElement("p");
    line.textContent = message;
    line.dataset.tone = tone;
    output.appendChild(line);

    while (output.children.length > TERMINAL_HISTORY_LIMIT) {
        output.removeChild(output.firstChild);
    }

    if (scroll) {
        output.scrollTop = output.scrollHeight;
    }
}

function appendTerminal(message, tone = "normal") {
    const tab = getActiveTerminalTab();

    tab.lines.push({ text: String(message), tone });

    while (tab.lines.length > TERMINAL_HISTORY_LIMIT) {
        tab.lines.shift();
    }

    appendTerminalLineToDom(message, tone);
    scheduleRenderOverview();
}

function appendTerminalBlock(lines, tone = "normal") {
    lines.forEach(line => appendTerminal(line, tone));
}

function appendTerminalChunk(rawChunk, tone = "normal") {
    const chunk = stripAnsi(String(rawChunk || "").replace(/\r/g, ""));

    if (!chunk.trim()) {
        return;
    }

    chunk.split("\n").forEach(line => {
        if (line.length) {
            appendTerminal(line, tone);
        }
    });
}

function stripAnsi(value) {
    return value.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, "");
}

function normalizeShellMode(shellMode) {
    return ["wsl", "powershell", "cmd"].includes(shellMode) ? shellMode : "wsl";
}

function startRealShell(shellMode = activeShellMode, force = false) {
    const nextMode = normalizeShellMode(shellMode);
    const modeChanged = nextMode !== activeShellMode;

    if (modeChanged) {
        pendingShellCommands = [];
        force = true;
    }

    activeShellMode = nextMode;

    if (!force && (terminalOnline || terminalStarting)) {
        return;
    }

    terminalOnline = false;
    terminalStarting = true;
    clearShellButtons();

    const activeButton = document.querySelector(`[data-shell-mode="${activeShellMode}"]`);

    if (activeButton) {
        activeButton.classList.add("active");
    }

    setText("terminalPrompt", getShellPrompt(activeShellMode));
    appendTerminal(`:: starting ${getShellLabel(activeShellMode)} session`, "prompt");
    ipcRenderer.send("terminal-start", activeShellMode);
}

function stopRealShell() {
    pendingShellCommands = [];
    terminalOnline = false;
    terminalStarting = false;
    ipcRenderer.send("terminal-stop");
    appendTerminal(`:: ${getShellLabel(activeShellMode)} stop requested`, "warn");
}

function interruptRealShell() {
    if (!terminalOnline) {
        appendTerminal(":: terminal is offline, nothing to interrupt", "warn");
        return;
    }

    ipcRenderer.send("terminal-interrupt");
    appendTerminal(":: Ctrl+C sent", "warn");
}

function clearShellButtons() {
    document.querySelectorAll("[data-shell-mode]").forEach(button => {
        button.classList.remove("active");
    });
}

function setTerminalStatus(payload) {
    const status = document.getElementById("terminalStatus");

    if (!status) {
        return;
    }

    status.textContent = payload.message || payload.status || "offline";
    status.dataset.status = payload.status || "offline";

    terminalOnline = payload.status === "online";
    terminalStarting = false;

    if (terminalOnline) {
        flushPendingShellCommands();
    }

    renderOverview();
    showToast("Terminal", status.textContent, payload.status === "error" ? "warn" : "info");
}

function getShellPrompt(shellMode) {
    const prompts = {
        wsl: "kali$",
        powershell: "PS>",
        cmd: "C:\\>"
    };

    return prompts[shellMode] || "shell>";
}

function getShellLabel(shellMode) {
    const labels = {
        wsl: "Kali WSL",
        powershell: "Windows PowerShell",
        cmd: "Windows CMD"
    };

    return labels[shellMode] || "shell";
}

function sendShellInput(rawCommand) {
    const command = String(rawCommand || "").trim();

    if (!command) {
        return;
    }

    commandHistory.push(command);
    commandHistory = commandHistory.slice(-TERMINAL_HISTORY_LIMIT);
    commandHistoryIndex = commandHistory.length;
    persistTerminalHistory();

    if (handleLocalTerminalCommand(command)) {
        return;
    }

    if (!terminalOnline) {
        pendingShellCommands.push(command);
        appendTerminal(`queued until ${getShellLabel(activeShellMode)} is online: ${command}`, "warn");
        startRealShell(activeShellMode);
        return;
    }

    appendTerminal(`${getShellPrompt(activeShellMode)} ${command}`, "prompt");
    ipcRenderer.send("terminal-input", `${command}\n`);
}

function handleLocalTerminalCommand(command) {
    if (!/^(db|database)(\s|$)/i.test(command)) {
        return false;
    }

    appendTerminal(`${getShellPrompt(activeShellMode)} ${command}`, "prompt");
    runDatabaseTerminalCommand(command);
    return true;
}

function runDatabaseTerminalCommand(command) {
    const [, action = "help", rawPayload = ""] = command.match(/^(?:db|database)(?:\s+(\S+))?(?:\s+([\s\S]+))?$/i) || [];
    const payload = rawPayload.trim();

    switch (String(action).toLowerCase()) {
        case "help":
            appendTerminalBlock([
                "CyberDesk database commands:",
                "db add title | tags | content",
                "db search words",
                "db list",
                "db show record_id",
                "db delete record_id",
                "db clear"
            ], "prompt");
            break;
        case "add":
            addDatabaseEntryFromCommand(payload);
            break;
        case "search":
        case "find":
            printDatabaseSearch(payload);
            break;
        case "list":
            printDatabaseSearch("");
            break;
        case "show":
            showDatabaseEntryInTerminal(payload);
            break;
        case "delete":
        case "del":
        case "rm":
            deleteDatabaseEntryFromTerminal(payload);
            break;
        case "clear":
            clearDatabase();
            appendTerminal("database cleared", "warn");
            break;
        default:
            appendTerminal(`unknown database action: ${action}`, "warn");
            appendTerminal("try: db help", "prompt");
    }

    openWindow("databaseWindow", { skipLaunchScript: true });
}

function addDatabaseEntryFromCommand(payload) {
    if (!payload) {
        appendTerminal("usage: db add title | tags | content", "warn");
        return;
    }

    const parts = payload.split("|").map(part => part.trim());
    const title = parts[0] || payload.slice(0, 64);
    const tags = parts.length >= 3 ? parts[1] : "terminal";
    const content = parts.length >= 3 ? parts.slice(2).join(" | ") : payload;
    const entry = normalizeDatabaseEntry({ title, tags, content, createdAt: new Date().toISOString() });

    databaseEntries.unshift(entry);
    persistDatabaseEntries();
    renderDatabase();
    scheduleRenderOverview();
    appendTerminal(`database saved: ${entry.id}`, "prompt");
}

function printDatabaseSearch(query) {
    const results = searchDatabase(query).slice(0, 12);

    if (!results.length) {
        appendTerminal(`database: no results for "${query || "all"}"`, "warn");
        return;
    }

    appendTerminal(`database results (${results.length}/${databaseEntries.length}):`, "prompt");
    results.forEach(entry => {
        const tags = entry.tags.length ? ` #${entry.tags.join(" #")}` : "";
        appendTerminal(`${entry.id} :: ${entry.title}${tags}`);
        appendTerminal(`  ${entry.content.replace(/\s+/g, " ").slice(0, 140)}`);
    });
}

function showDatabaseEntryInTerminal(id) {
    const entry = databaseEntries.find(item => item.id === id);

    if (!entry) {
        appendTerminal(`database record not found: ${id}`, "warn");
        return;
    }

    appendTerminalBlock(formatDatabaseEntry(entry).split("\n"));
}

function deleteDatabaseEntryFromTerminal(id) {
    const before = databaseEntries.length;

    databaseEntries = databaseEntries.filter(entry => entry.id !== id);
    persistDatabaseEntries();
    renderDatabase();
    scheduleRenderOverview();
    appendTerminal(
        before === databaseEntries.length ? `database record not found: ${id}` : `database deleted: ${id}`,
        before === databaseEntries.length ? "warn" : "prompt"
    );
}

function flushPendingShellCommands() {
    const queued = [...pendingShellCommands];
    pendingShellCommands = [];

    queued.forEach(command => {
        appendTerminal(`${getShellPrompt(activeShellMode)} ${command}`, "prompt");
        ipcRenderer.send("terminal-input", `${command}\n`);
    });
}

function clearTerminal() {
    const tab = getActiveTerminalTab();

    tab.lines = [];
    renderTerminalOutput();
}

function createTerminalTab() {
    const id = `tab-${Date.now()}`;
    const index = terminalTabs.length + 1;

    terminalTabs.push({
        id,
        name: `Tab ${index}`,
        lines: []
    });
    activeTerminalTabId = id;
    renderTerminalTabs();
    renderTerminalOutput();
    appendTerminal(`:: ${getShellLabel(activeShellMode)} shared session attached`, "prompt");
}

function switchTerminalTab(id) {
    activeTerminalTabId = id;
    renderTerminalTabs();
    renderTerminalOutput();
}

async function copyTerminalOutput() {
    const tab = getActiveTerminalTab();
    const text = tab.lines.map(item => item.text).join("\n");

    try {
        await navigator.clipboard.writeText(text);
        showToast("Terminal copied", `${tab.lines.length} line(s)`);
    } catch {
        appendTerminal("Clipboard unavailable.", "warn");
    }
}

async function pasteIntoTerminal() {
    const input = document.getElementById("terminalInput");

    if (!input) {
        return;
    }

    try {
        input.value = await navigator.clipboard.readText();
        input.focus();
    } catch {
        appendTerminal("Clipboard paste unavailable.", "warn");
    }
}

function saveTerminalOutputToLogbook() {
    const tab = getActiveTerminalTab();
    const text = tab.lines.slice(-40).map(item => item.text).join("\n").trim();

    if (!text) {
        showToast("Terminal note", "Nothing to save", "warn");
        return;
    }

    logbookEntries.unshift({
        id: `note-${Date.now()}`,
        text: `Terminal snapshot (${tab.name})\n${text}`,
        tags: ["terminal"],
        createdAt: new Date().toISOString()
    });
    logbookEntries = logbookEntries.slice(0, 80);
    persistLogbookEntries();
    renderLogbook();
    renderOverview();
    showToast("Logbook", "Terminal snapshot saved");
}

function browseHistory(direction) {
    const input = document.getElementById("terminalInput");

    if (!commandHistory.length) {
        return;
    }

    commandHistoryIndex = Math.min(
        commandHistory.length,
        Math.max(0, commandHistoryIndex + direction)
    );

    input.value = commandHistory[commandHistoryIndex] || "";
}

function runTerminalPreset(command) {
    openWindow("terminalWindow");
    sendShellInput(getPresetShellCommand(command, activeShellMode));
}

function runKaliCommand(command) {
    openWindow("terminalWindow");
    startRealShell("wsl");
    sendShellInput(command);
}

function getPresetShellCommand(command, shellMode = activeShellMode) {
    const presets = {
        wsl: {
            help: "help",
            sys: "uname -a; whoami; pwd; cat /etc/os-release | head",
            net: "ip addr || ifconfig || cat /proc/net/route",
            process: "ps aux | head -20",
            ports: "ss -tulpn 2>/dev/null || netstat -tulpn 2>/dev/null",
            disk: "df -h; free -h",
            env: "env | sort | head -80",
            audit: "uname -a; ip -o -4 addr show; ss -tulpn 2>/dev/null | head -30; ps aux --sort=-%mem | head -10",
            "ping-local": "ping -c 4 127.0.0.1"
        },
        powershell: {
            help: "Get-Help about_CommonParameters",
            sys: "Get-ComputerInfo | Select-Object CsName,OsName,OsArchitecture,WindowsVersion; whoami; Get-Location",
            net: "Get-NetIPConfiguration | Format-List; Get-NetAdapter | Format-Table -AutoSize",
            process: "Get-Process | Sort-Object CPU -Descending | Select-Object -First 20 ProcessName,Id,CPU,WS",
            ports: "Get-NetTCPConnection -State Listen | Select-Object -First 40 LocalAddress,LocalPort,OwningProcess",
            disk: "Get-PSDrive -PSProvider FileSystem | Format-Table -AutoSize",
            env: "Get-ChildItem Env: | Sort-Object Name | Select-Object -First 80",
            audit: "whoami; Get-Date; Get-NetIPConfiguration; Get-Process | Sort-Object WS -Descending | Select-Object -First 12 ProcessName,Id,WS",
            "ping-local": "Test-Connection 127.0.0.1 -Count 4"
        },
        cmd: {
            help: "help",
            sys: "ver & whoami & cd",
            net: "ipconfig /all",
            process: "tasklist",
            ports: "netstat -ano",
            disk: "wmic logicaldisk get caption,freespace,size,volumename",
            env: "set",
            audit: "whoami & date /t & time /t & ipconfig & tasklist",
            "ping-local": "ping 127.0.0.1"
        }
    };

    const mode = normalizeShellMode(shellMode);

    return presets[mode]?.[command] || presets.wsl[command] || command;
}

/* ===================================================== */
/* MATRIX SEARCH: ricerca file locale tramite Kali WSL */
/* ===================================================== */

function initializeMatrixSearch() {
    const form = document.getElementById("searchForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        await executeMatrixSearch();
    });
}

async function executeMatrixSearch() {
    const root = readInput("searchRoot") || "/mnt/c/Users/steal";
    const query = readInput("searchQuery");

    if (!query) {
        setSearchStatus("query required", "warn");
        return;
    }

    const output = document.getElementById("searchOutput");
    output.innerHTML = "";
    setSearchStatus("scanning matrix...", "online");
    playLaunchZoom("matrix search");

    addSearchLine(`kali$ find ${root} -iname "${query}"`);

    try {
        const result = await ipcRenderer.invoke("matrix-search", {
            root,
            query
        });

        const lines = String(result.output || "")
            .split(/\r?\n/)
            .filter(Boolean);

        if (!lines.length) {
            addSearchLine("no matches found", "warn");
        } else {
            lines.forEach(line => addSearchLine(line));
        }

        setSearchStatus(`${lines.length} result(s)`, "online");
    } catch {
        addSearchLine("search failed", "warn");
        setSearchStatus("search failed", "warn");
    }
}

function addSearchLine(message, tone = "normal") {
    const output = document.getElementById("searchOutput");
    const line = document.createElement("p");

    line.textContent = message;
    line.dataset.tone = tone;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function setSearchStatus(message, tone = "normal") {
    const status = document.getElementById("searchStatus");

    if (!status) {
        return;
    }

    status.textContent = message;
    status.dataset.status = tone;
}

function clearSearchOutput() {
    const output = document.getElementById("searchOutput");

    if (output) {
        output.innerHTML = "";
    }

    setSearchStatus("idle", "normal");
}

async function terminalSystemInfo() {
    await refreshSystemInfo();

    if (!latestSystemInfo) {
        appendTerminal("System info unavailable.", "warn");
        return;
    }

    appendTerminalBlock([
        `hostname: ${latestSystemInfo.hostname}`,
        `platform: ${latestSystemInfo.platform}`,
        `arch: ${latestSystemInfo.arch}`,
        `cpu cores: ${latestSystemInfo.cpus}`,
        `cpu used: ${latestSystemInfo.cpu}%`,
        `ram used: ${latestSystemInfo.ram}%`,
        `uptime: ${latestSystemInfo.uptime} minutes`,
        `local ip: ${latestSystemInfo.ip}`
    ]);
}

async function terminalNetworkInfo() {
    await refreshNetwork();

    if (!latestNetworkInfo.length) {
        appendTerminal("No local interfaces found.", "warn");
        return;
    }

    latestNetworkInfo.forEach(item => {
        appendTerminal(`${item.InterfaceAlias || "adapter"} -> ${item.IPAddress || "no ip"}`);
    });
}

async function terminalProcessInfo() {
    await refreshProcesses();

    if (!latestProcesses.length) {
        appendTerminal("Process data unavailable.", "warn");
        return;
    }

    latestProcesses.forEach(item => {
        appendTerminal(`${item.ProcessName || "unknown"}.exe  ${item.RAM || 0} MB`);
    });
}

async function terminalSafeCommand(commandId) {
    try {
        const result = await ipcRenderer.invoke("run-safe-command", commandId);
        appendTerminalBlock(String(result.output || "").trim().split(/\r?\n/).filter(Boolean));
    } catch {
        appendTerminal("Safe command failed.", "warn");
    }
}

function launchFromTerminal(id) {
    if (!id) {
        appendTerminal("Usage: launch <id>", "warn");
        return;
    }

    const launcher = getAllLaunchers().find(item => item.id === id);

    if (!launcher) {
        appendTerminal(`Launcher not found: ${id}`, "warn");
        return;
    }

    launchApp(launcher.id);
}

/* ===================================================== */
/* LAUNCHER: griglia app e apertura tramite main process */
/* ===================================================== */

function renderLaunchers() {
    const grid = document.getElementById("appLauncherGrid");
    const categories = document.getElementById("launcherCategories");

    if (!grid) {
        return;
    }

    const launchers = getAllLaunchers();
    const categoryList = ["all", "favorites", ...Array.from(new Set(launchers.map(inferLauncherCategory)))];

    if (categories) {
        categories.innerHTML = "";
        categoryList.forEach(category => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = category;
            button.dataset.active = String(launcherCategory === category);
            button.addEventListener("click", () => {
                launcherCategory = category;
                renderLaunchers();
            });
            categories.appendChild(button);
        });
    }

    grid.innerHTML = "";

    launchers
        .filter(launcher => {
            const category = inferLauncherCategory(launcher);
            const isFavorite = settings.favoriteLauncherIds.includes(launcher.id);
            const matchesCategory =
                launcherCategory === "all" ||
                (launcherCategory === "favorites" && isFavorite) ||
                launcherCategory === category;
            const haystack = `${launcher.name} ${launcher.id} ${launcher.kind} ${launcher.target || ""}`.toLowerCase();

            return matchesCategory && (!launcherSearchQuery || haystack.includes(launcherSearchQuery));
        })
        .sort((left, right) => {
            const leftFavorite = settings.favoriteLauncherIds.includes(left.id) ? 0 : 1;
            const rightFavorite = settings.favoriteLauncherIds.includes(right.id) ? 0 : 1;

            return leftFavorite - rightFavorite || left.name.localeCompare(right.name);
        })
        .forEach(launcher => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "launcher-tile";
        button.addEventListener("click", () => launchApp(launcher.id));

        const favorite = document.createElement("i");
        favorite.textContent = settings.favoriteLauncherIds.includes(launcher.id) ? "PINNED" : "PIN";
        favorite.addEventListener("click", event => {
            event.stopPropagation();
            toggleLauncherFavorite(launcher.id);
        });

        const badge = document.createElement("span");
        badge.textContent = launcher.badge;

        const name = document.createElement("strong");
        name.textContent = launcher.name;

        const id = document.createElement("small");
        id.textContent = `${inferLauncherCategory(launcher)} / ${launcher.id}`;

        button.append(favorite, badge, name, id);
        grid.appendChild(button);
    });

    if (!grid.children.length) {
        grid.innerHTML = "<p>No launcher matched.</p>";
    }
}

function inferLauncherCategory(launcher) {
    if (launcher.kind === "shell") {
        return "commands";
    }

    if (launcher.kind === "custom") {
        return launcher.type === "url" ? "web" : launcher.type === "folder" ? "files" : "apps";
    }

    if (["github", "protonMail", "protonPass", "maps", "youtube"].includes(launcher.target)) {
        return "web";
    }

    if (["explorer", "apps", "games"].includes(launcher.target)) {
        return "files";
    }

    return "system";
}

function toggleLauncherFavorite(id) {
    const favorites = new Set(settings.favoriteLauncherIds);

    if (favorites.has(id)) {
        favorites.delete(id);
    } else {
        favorites.add(id);
    }

    settings.favoriteLauncherIds = Array.from(favorites);
    persistSettings();
    renderLaunchers();
    showToast("Launcher", favorites.has(id) ? "Pinned to favorites" : "Removed from favorites");
}

function launchApp(id) {
    const launcher = getAllLaunchers().find(item => item.id === id);

    if (!launcher) {
        appendTerminal(`Launcher not found: ${id}`, "warn");
        return;
    }

    playLaunchZoom(launcher.name);

    if (launcher.target === "wsl") {
        openWindow("terminalWindow", { skipLaunchScript: true });
        startRealShell("wsl", true);
        appendTerminal("Kali WSL terminal focused.");
        return;
    }


    if (launcher.kind === "shell") {
        openWindow("terminalWindow", { skipLaunchScript: true });
        sendShellInput(launcher.command);
        return;
    }

    if (launcher.kind === "custom") {
        ipcRenderer.send("open-custom-entry", {
            kind: launcher.type,
            target: launcher.target,
            name: launcher.name
        });
    } else {
        ipcRenderer.send("open-tool", launcher.target);
    }

    appendTerminal(`Launching ${launcher.name}...`);
    showToast("Launcher", launcher.name);
}

/* ===================================================== */
/* SYSTEM DATA: monitor, rete e processi */
/* ===================================================== */

async function refreshSystemInfo() {
    try {
        latestSystemInfo = await ipcRenderer.invoke("get-system-info");
        const cpu = Number(latestSystemInfo.cpu || 0);
        const ram = Number(latestSystemInfo.ram || 0);

        setText("cpuMetric", `${cpu}%`);
        setText("ramMetric", `${ram}%`);
        setText("hostMetric", latestSystemInfo.hostname);
        setText("ipMetric", latestSystemInfo.ip);
        setText("overviewCpu", `${cpu}%`);
        setText("overviewRam", `${ram}%`);
        recordSystemSample(cpu, ram);
        document.body.classList.toggle("performance-lite", isLitePerformance());
        renderOverview();
        renderSystemCharts();

        setMeterWidth("cpuMeter", cpu);
        setMeterWidth("ramMeter", ram);
    } catch {
        latestSystemInfo = null;
    }
}

function setMeterWidth(id, value) {
    const meter = document.getElementById(id);

    if (meter) {
        meter.style.width = `${clampPercent(value)}%`;
    }
}

async function refreshNetwork() {
    const networkList = document.getElementById("networkList");

    try {
        const response = await ipcRenderer.invoke("get-network-details");
        latestNetworkInfo = Array.isArray(response)
            ? response
            : response
                ? [response]
                : [];

        networkList.innerHTML = "";

        latestNetworkInfo.forEach(item => {
            const row = document.createElement("div");
            row.className = "network-row";
            row.innerHTML = `
                <span>${escapeHtml(item.InterfaceAlias || "adapter")}</span>
                <strong>${escapeHtml(item.IPAddress || "no ip")}</strong>
            `;
            networkList.appendChild(row);
        });

        if (!latestNetworkInfo.length) {
            networkList.innerHTML = "<p>No active local adapter found.</p>";
        }

        renderOverview();
    } catch {
        latestNetworkInfo = [];
        networkList.innerHTML = "<p>Network data unavailable.</p>";
        renderOverview();
    }
}

async function refreshProcesses() {
    try {
        const response = await ipcRenderer.invoke("get-top-processes");
        latestProcesses = Array.isArray(response)
            ? response
            : response
                ? [response]
                : [];

        renderProcessChart();
    } catch {
        latestProcesses = [];
        renderProcessChart();
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ===================================================== */
/* SETTINGS UI: salva identita, tema e launcher custom */
/* ===================================================== */

function saveSettings() {
    settings.systemLabel = readInput("settingSystemLabel") || DEFAULT_SETTINGS.systemLabel;
    settings.operator = readInput("settingOperator") || DEFAULT_SETTINGS.operator;
    settings.theme = readInput("settingTheme") || DEFAULT_SETTINGS.theme;
    settings.scanline = readInput("settingScanline") || DEFAULT_SETTINGS.scanline;
    settings.performanceMode = readInput("settingPerformanceMode") || DEFAULT_SETTINGS.performanceMode;
    settings.autoLockMinutes = normalizeAutoLockMinutes(readInput("settingAutoLock"));
    settings.startupMode = readInput("settingStartupMode") || DEFAULT_SETTINGS.startupMode;
    displayMode = readInput("settingDisplayMode") || "primary";
    const nextUpdateFeedUrl = readInput("settingUpdateFeed");

    persistSettings();
    applySettings();
    resetAutoLockTimer();
    ipcRenderer.send("set-display-mode", displayMode);
    saveUpdateFeed(nextUpdateFeedUrl);
    appendTerminal("Settings saved.");
    showToast("Settings saved", `${settings.theme} theme / ${settings.performanceMode} performance`);
}

function resetSettings() {
    settings = structuredClone(DEFAULT_SETTINGS);
    persistSettings();
    applySettings();
    resetAutoLockTimer();
    appendTerminal("Settings reset.");
    showToast("Settings reset", "Default profile restored");
}

function addCustomLauncher() {
    const launcher = normalizeLauncher({
        name: readInput("customName"),
        type: readInput("customType"),
        target: readInput("customTarget")
    });

    if (!launcher) {
        appendTerminal("Custom launcher requires name and target.", "warn");
        return;
    }

    settings.customLaunchers.push(launcher);
    persistSettings();
    applySettings();

    setInputValue("customName", "");
    setInputValue("customTarget", "");
    setInputValue("customType", "url");

    appendTerminal(`Custom launcher added: ${launcher.name}`);
}

function clearCustomLaunchers() {
    settings.customLaunchers = [];
    persistSettings();
    applySettings();
    appendTerminal("Custom launchers cleared.");
}

async function initializeUpdater() {
    renderUpdateStatus({
        status: "idle",
        message: "Updater ready.",
        feedUrl: updateFeedUrl
    });

    try {
        const status = await ipcRenderer.invoke("get-update-status");

        updateStatus = status;
        updateFeedUrl = status.feedUrl || "";
        renderUpdateStatus(status);
    } catch {
        renderUpdateStatus({
            status: "error",
            message: "Updater unavailable.",
            feedUrl: updateFeedUrl
        });
    }
}

function renderUpdateStatus(status) {
    updateStatus = {
        status: "idle",
        message: "Updater ready.",
        feedUrl: updateFeedUrl,
        currentVersion: APP_VERSION,
        progress: null,
        available: false,
        downloaded: false,
        ...status
    };

    updateFeedUrl = updateStatus.feedUrl || "";

    const feedInput = document.getElementById("settingUpdateFeed");

    if (feedInput && document.activeElement !== feedInput) {
        feedInput.value = updateFeedUrl;
    }

    const badge = document.getElementById("updateStatusBadge");

    if (badge) {
        badge.textContent = String(updateStatus.status || "idle").toUpperCase();
        badge.dataset.status = updateStatus.status || "idle";
    }

    setText("updateStatusText", `${updateStatus.message || "Updater ready."} :: v${updateStatus.currentVersion || APP_VERSION}`);

    const progressBar = document.getElementById("updateProgressBar");
    const progress = Math.max(0, Math.min(100, Number(updateStatus.progress?.percent || 0)));

    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }

    const downloadButton = document.getElementById("downloadUpdateButton");
    const installButton = document.getElementById("installUpdateButton");

    if (downloadButton) {
        downloadButton.disabled = updateStatus.status !== "available";
    }

    if (installButton) {
        installButton.disabled = updateStatus.status !== "downloaded";
    }

    renderOverview();
}

function reportUpdateStatus(status) {
    renderUpdateStatus(status);

    const statusKey = `${status?.status || "idle"}:${status?.message || ""}`;

    if (statusKey !== lastUpdateStatusKey && status?.status !== "downloading") {
        appendTerminal(`Updater: ${status?.message || "status updated"}`);
        showToast("Updater", status?.message || "status updated", status?.status === "error" ? "warn" : "info");
        lastUpdateStatusKey = statusKey;
    }
}

async function saveUpdateFeed(feedUrl = readInput("settingUpdateFeed")) {
    try {
        const status = await ipcRenderer.invoke("set-update-feed", feedUrl);

        reportUpdateStatus(status);
    } catch {
        reportUpdateStatus({
            status: "error",
            message: "Unable to save update feed."
        });
    }
}

async function checkForUpdates() {
    try {
        reportUpdateStatus({
            status: "checking",
            message: "Checking for CyberDesk updates.",
            feedUrl: readInput("settingUpdateFeed")
        });

        const status = await ipcRenderer.invoke("check-for-updates", readInput("settingUpdateFeed"));

        reportUpdateStatus(status);
    } catch {
        reportUpdateStatus({
            status: "error",
            message: "Update check failed."
        });
    }
}

async function downloadUpdate() {
    try {
        const status = await ipcRenderer.invoke("download-update");

        reportUpdateStatus(status);
    } catch {
        reportUpdateStatus({
            status: "error",
            message: "Update download failed."
        });
    }
}

async function installUpdate() {
    try {
        const status = await ipcRenderer.invoke("install-update");

        reportUpdateStatus(status);
    } catch {
        reportUpdateStatus({
            status: "error",
            message: "Update install failed."
        });
    }
}

function readInput(id) {
    const input = document.getElementById(id);
    return input ? input.value.trim() : "";
}

/* ===================================================== */
/* BACKGROUND EFFECTS: matrice, grafo e compilazione */
/* ===================================================== */

function initializeMatrixCanvas() {
    const canvas = document.getElementById("matrixCanvas");

    if (!canvas || settings.scanline === "off") {
        return;
    }

    const ctx = canvas.getContext("2d");
    const chars = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&/";
    let drops = [];
    let lastFrame = 0;

    function resize() {
        const scale = isLitePerformance() ? 0.42 : 0.62;
        canvas.width = Math.max(1, Math.floor(window.innerWidth * scale));
        canvas.height = Math.max(1, Math.floor(window.innerHeight * scale));
        const cellSize = isLitePerformance() ? 26 : 16;
        const columns = Math.floor(canvas.width / cellSize);
        drops = Array.from({ length: columns }, () => Math.random() * canvas.height);
    }

    function draw(timestamp = 0) {
        requestAnimationFrame(draw);

        const frameDelay = document.body.classList.contains("window-dragging")
            ? 180
            : isLitePerformance() ? 95 : 48;

        if (timestamp - lastFrame < frameDelay) {
            return;
        }

        lastFrame = timestamp;
        const cellSize = isLitePerformance() ? 26 : 16;
        const fontSize = isLitePerformance() ? 12 : 14;

        ctx.fillStyle = isLitePerformance() ? "rgba(0, 0, 0, 0.16)" : "rgba(0, 0, 0, 0.08)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = settings.accent;
        ctx.font = `${fontSize}px Consolas, monospace`;

        drops.forEach((y, index) => {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const x = index * cellSize;
            ctx.fillText(char, x, y);
            drops[index] = y > canvas.height + Math.random() * 10000 ? 0 : y + cellSize;
        });
    }

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(draw);
}

function initializeTraceCanvas() {
    const canvas = document.getElementById("traceCanvas");
    const ctx = canvas.getContext("2d");
    const traceWindow = document.getElementById("traceWindow");
    const nodes = Array.from({ length: isLitePerformance() ? 22 : 42 }, () => ({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.002
    }));
    let lastFrame = 0;

    function resize() {
        const scale = isLitePerformance() ? 0.62 : 0.78;
        canvas.width = Math.max(1, Math.floor(canvas.offsetWidth * scale));
        canvas.height = Math.max(1, Math.floor(canvas.offsetHeight * scale));
    }

    function draw(timestamp = 0) {
        requestAnimationFrame(draw);

        const isHidden = traceWindow?.classList.contains("hidden-window");
        const frameDelay = document.body.classList.contains("window-dragging")
            ? 180
            : isHidden ? 900 : isLitePerformance() ? 90 : 48;

        if (timestamp - lastFrame < frameDelay) {
            return;
        }

        lastFrame = timestamp;

        if (isHidden && isLitePerformance()) {
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = `rgba(${hexToRgb(settings.accent)}, 0.55)`;
        ctx.fillStyle = settings.accent;

        nodes.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;

            if (node.x < 0 || node.x > 1) {
                node.vx *= -1;
            }

            if (node.y < 0 || node.y > 1) {
                node.vy *= -1;
            }
        });

        nodes.forEach((node, index) => {
            const x = node.x * canvas.width;
            const y = node.y * canvas.height;

            for (let otherIndex = index + 1; otherIndex < nodes.length; otherIndex++) {
                const other = nodes[otherIndex];
                const ox = other.x * canvas.width;
                const oy = other.y * canvas.height;
                const distance = Math.hypot(x - ox, y - oy);

                if (distance < 110) {
                    ctx.globalAlpha = 1 - distance / 110;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(ox, oy);
                    ctx.stroke();
                }
            }

            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(draw);
}

function initializeCompileMatrix() {
    const target = document.getElementById("compileMatrix");
    const matrixWindow = document.getElementById("matrixWindow");
    const chars = "010101 CYBERDESK ETHICAL LAB TRACE SAFE";

    setInterval(() => {
        if (matrixWindow?.classList.contains("hidden-window") && isLitePerformance()) {
            return;
        }

        const lineCount = isLitePerformance() ? 10 : 16;
        const lineLength = isLitePerformance() ? 28 : 38;
        const lines = Array.from({ length: lineCount }, () => {
            return Array.from({ length: lineLength }, () => {
                return chars[Math.floor(Math.random() * chars.length)];
            }).join("");
        });

        target.textContent = lines.join("\n");
    }, isLitePerformance() ? 360 : 160);
}

/* ===================================================== */
/* ELECTRON WINDOW CONTROLS: finestra nativa */
/* ===================================================== */

function minimizeWindow() {
    ipcRenderer.send("window-minimize");
}

function closeWindow() {
    ipcRenderer.send("window-close");
}

ipcRenderer.on("restore-window", () => {
    document.body.classList.remove("minimizing");
});

ipcRenderer.on("animate-minimize", () => {
    document.body.classList.add("minimizing");
});

ipcRenderer.on("display-mode-updated", (event, config) => {
    displayMode = config?.multiDisplay || "primary";
    setInputValue("settingDisplayMode", displayMode);
    appendTerminal(`Display mode updated: ${displayMode}.`);
});

ipcRenderer.on("update-status", (event, status) => {
    reportUpdateStatus(status);
});

/* ===================================================== */
/* INITIALIZATION: avvio ordinato di tutti i moduli */
/* ===================================================== */

async function initializeApp() {
    applySettings();
    initializeBootProfile();
    initializeWindowManager();
    initializeTerminal();
    initializeMatrixSearch();
    initializeMatrixCanvas();
    initializeTraceCanvas();
    initializeCompileMatrix();
    initializeV2Shell();
    await initializeAuth();
    initializeDisplayModeSetting();
    initializeUpdater();
    initializeAutoLock();
    runBootSequence();

    updateClock();
    setInterval(updateClock, 1000);

    refreshSystemInfo();
    refreshNetwork();
    refreshProcesses();

    setInterval(refreshSystemInfo, 6000);
    setInterval(refreshProcesses, 10000);
    setInterval(refreshNetwork, 20000);
}

/* ===================================================== */
/* GLOBAL EXPORTS: funzioni chiamate dagli onclick HTML */
/* ===================================================== */

window.minimizeWindow = minimizeWindow;
window.closeWindow = closeWindow;
window.sendShellInput = sendShellInput;
window.runTerminalPreset = runTerminalPreset;
window.runKaliCommand = runKaliCommand;
window.refreshNetwork = refreshNetwork;
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
window.saveUpdateFeed = saveUpdateFeed;
window.checkForUpdates = checkForUpdates;
window.downloadUpdate = downloadUpdate;
window.installUpdate = installUpdate;
window.addCustomLauncher = addCustomLauncher;
window.clearCustomLaunchers = clearCustomLaunchers;
window.clearSearchOutput = clearSearchOutput;
window.clearLogbook = clearLogbook;
window.copyLogbookMarkdown = copyLogbookMarkdown;
window.clearDatabase = clearDatabase;
window.copyDatabaseJson = copyDatabaseJson;
window.applyNamedLayout = applyNamedLayout;
window.saveCurrentLayout = saveCurrentLayout;
window.replayBootSequence = replayBootSequence;
window.toggleFocusMode = toggleFocusMode;
window.cleanDesktop = cleanDesktop;
window.copySystemSnapshot = copySystemSnapshot;
window.cycleTheme = cycleTheme;
window.toggleBoostMode = toggleBoostMode;
window.restoreGovVisualProfile = restoreGovVisualProfile;
window.clearVisualCaches = clearVisualCaches;
window.createSessionBrief = createSessionBrief;
window.runSecuritySweep = runSecuritySweep;
window.lockSession = lockSession;
window.unlockSession = unlockSession;
window.refreshAccountUsers = refreshAccountUsers;
window.logoutAccount = logoutAccount;

initializeApp();
