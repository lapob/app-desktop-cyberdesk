const { app, BrowserWindow, ipcMain, shell, screen } = require("electron");

/* CyberDesk 2.0.0 main process.
 * Qui vivono finestra Electron, bridge IPC, terminale locale, updater e launcher.
 */
const { autoUpdater } = require("electron-updater");
const path = require("path");
const os = require("os");
const fs = require("fs");
const crypto = require("crypto");
const { exec, execFile, execFileSync, spawn } = require("child_process");
const util = require("util");

const execPromise = util.promisify(exec);
const execFilePromise = util.promisify(execFile);

let mainWindow;
let appWindows = [];
const appIconPath = path.join(__dirname, "..", "build", "app-icon-gov.ico");
let terminalProcess = null;
let terminalMode = "wsl";
let cachedKaliArgs = null;
let ownedWslDistroName = null;
let ownedDefaultWslSession = false;
let previousCpuTimes = null;
const authSessions = new Map();
const AUTH_MAX_FAILED_ATTEMPTS = 5;
const AUTH_LOCK_MS = 5 * 60 * 1000;

const DEFAULT_APP_CONFIG = {
    multiDisplay: "primary",
    updateFeedUrl: ""
};

const DEFAULT_UPDATE_STATE = {
    status: "idle",
    message: "Updater ready.",
    currentVersion: app.getVersion(),
    version: null,
    feedUrl: "",
    effectiveFeedUrl: "",
    available: false,
    downloaded: false,
    progress: null
};

let updateState = { ...DEFAULT_UPDATE_STATE };

configureChromiumPerformance();

/* ===================================================== */
/* CHROMIUM PERFORMANCE */
/* ===================================================== */

function configureChromiumPerformance() {
    app.commandLine.appendSwitch("log-level", "3");
    app.commandLine.appendSwitch("disable-logging");
    app.commandLine.appendSwitch("disable-zero-copy");
    app.commandLine.appendSwitch("force-gpu-mem-available-mb", "1024");
    app.commandLine.appendSwitch("enable-low-end-device-mode");
}

/* ===================================================== */
/* APPLICATION WINDOW */
/* ===================================================== */

/* Crea una finestra desktop vera dell'app Electron su uno specifico monitor. */
function createWindow(targetDisplay, isPrimary = false, displayIndex = 0, totalDisplays = 1) {
    const workArea = targetDisplay?.workArea || screen.getPrimaryDisplay().workArea;
    const displayRole = isPrimary
        ? "primary"
        : displayIndex % 2 === 1
            ? "dashboard"
            : "ops";
    const window = new BrowserWindow({
        x: workArea.x,
        y: workArea.y,
        width: workArea.width,
        height: workArea.height,
        minWidth: 760,
        minHeight: 640,
        fullscreen: true,
        frame: false,
        backgroundColor: "#020403",
        icon: appIconPath,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    window.loadFile(path.join(__dirname, "index.html"), {
        query: {
            displayRole,
            displayIndex: String(displayIndex),
            displayTotal: String(totalDisplays)
        }
    });

    window.on("restore", () => {
        window.webContents.send("restore-window");
    });

    window.on("show", () => {
        window.webContents.send("restore-window");
    });

    window.on("focus", () => {
        window.webContents.send("restore-window");
        mainWindow = window;
    });

    window.on("closed", () => {
        appWindows = appWindows.filter(item => item !== window);

        if (mainWindow === window) {
            mainWindow = appWindows[0] || null;
        }
    });

    appWindows.push(window);

    if (isPrimary || !mainWindow) {
        mainWindow = window;
    }

    return window;
}

function createConfiguredWindows() {
    const config = loadAppConfig();
    const displays = [screen.getPrimaryDisplay()];
    const primaryId = screen.getPrimaryDisplay().id;

    displays.forEach((display, index) => {
        createWindow(display, display.id === primaryId, index, displays.length);
    });
}

function getActiveWindow(event) {
    return BrowserWindow.fromWebContents(event?.sender) || mainWindow || appWindows[0];
}

function broadcastToRenderers(channel, payload) {
    appWindows.forEach(window => {
        if (!window.isDestroyed()) {
            window.webContents.send(channel, payload);
        }
    });
}

function getConfigPath() {
    return path.join(app.getPath("userData"), "cyberdesk-config.json");
}

function loadAppConfig() {
    try {
        return {
            ...DEFAULT_APP_CONFIG,
            ...JSON.parse(fs.readFileSync(getConfigPath(), "utf8"))
        };
    } catch {
        return { ...DEFAULT_APP_CONFIG };
    }
}

function saveAppConfig(config) {
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}

/* ===================================================== */
/* LOCAL AUTH DATABASE */
/* ===================================================== */

function getAuthDbPath() {
    return path.join(app.getPath("userData"), "cyberdesk-auth.json");
}

/* Legge il database utenti locale. Se il file non esiste, parte pulito. */
function loadAuthDb() {
    try {
        const db = JSON.parse(fs.readFileSync(getAuthDbPath(), "utf8"));

        return {
            version: 1,
            users: Array.isArray(db.users) ? db.users : []
        };
    } catch {
        return {
            version: 1,
            users: []
        };
    }
}

/* Salvataggio atomico: scrive prima un .tmp e poi sostituisce il file finale. */
function saveAuthDb(db) {
    const authPath = getAuthDbPath();
    const tempPath = `${authPath}.tmp`;

    fs.mkdirSync(path.dirname(authPath), { recursive: true });
    fs.writeFileSync(tempPath, JSON.stringify({
        version: 1,
        users: db.users
    }, null, 2));
    fs.renameSync(tempPath, authPath);
}

/* Username stabile per login e lookup: niente spazi, maiuscole o caratteri strani. */
function normalizeUsername(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "")
        .slice(0, 32);
}

function normalizeDisplayName(value, fallback) {
    return String(value || fallback || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 40);
}

/* Regola minima locale: semplice da capire, ma evita password troppo deboli. */
function validatePassword(password) {
    const value = String(password || "");

    if (value.length < 8) {
        return "Password must be at least 8 characters.";
    }

    if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
        return "Password must include letters and numbers.";
    }

    return "";
}

/* Le password non vengono salvate: resta solo hash scrypt + salt casuale. */
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    const hash = crypto.scryptSync(String(password), salt, 64, {
        N: 16384,
        r: 8,
        p: 1,
        maxmem: 64 * 1024 * 1024
    }).toString("hex");

    return { salt, hash };
}

/* Confronto timing-safe per evitare differenze misurabili tra hash corretti/sbagliati. */
function verifyPassword(password, user) {
    const next = hashPassword(password, user.salt);
    const left = Buffer.from(next.hash, "hex");
    const right = Buffer.from(user.passwordHash || "", "hex");

    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function publicAuthUser(user) {
    if (!user) {
        return null;
    }

    return {
        username: user.username,
        displayName: user.displayName || user.username,
        role: user.role || "user",
        disabled: Boolean(user.disabled),
        createdAt: user.createdAt || "",
        updatedAt: user.updatedAt || "",
        lastLoginAt: user.lastLoginAt || "",
        loginCount: Number(user.loginCount || 0),
        failedAttempts: Number(user.failedAttempts || 0),
        lockedUntil: Number(user.lockedUntil || 0),
        online: Array.from(authSessions.values()).includes(user.username)
    };
}

function getAuthSessionUser(event) {
    const username = authSessions.get(event?.sender?.id);

    if (!username) {
        return null;
    }

    return loadAuthDb().users.find(user => user.username === username) || null;
}

function countActiveAdmins(db) {
    return db.users.filter(user => user.role === "admin" && !user.disabled).length;
}

function okAuth(payload = {}) {
    return { ok: true, ...payload };
}

function failAuth(message) {
    return { ok: false, message };
}

function syncDisplayMode(mode) {
    const nextMode = mode === "primary" ? "primary" : "all";
    const config = {
        ...loadAppConfig(),
        multiDisplay: nextMode
    };

    saveAppConfig(config);

    const displays = nextMode === "all"
        ? screen.getAllDisplays()
        : [screen.getPrimaryDisplay()];
    const displayIds = new Set(displays.map(display => display.id));
    const primaryId = screen.getPrimaryDisplay().id;

    appWindows.forEach(window => {
        const display = screen.getDisplayMatching(window.getBounds());

        if (!displayIds.has(display.id) && appWindows.length > 1) {
            window.close();
        }
    });

    displays.forEach(display => {
        const alreadyOpen = appWindows.some(window => {
            const existingDisplay = screen.getDisplayMatching(window.getBounds());

            return existingDisplay.id === display.id;
        });

        if (!alreadyOpen) {
            createWindow(display, display.id === primaryId, displays.indexOf(display), displays.length);
        }
    });

    broadcastToRenderers("display-mode-updated", config);
}

app.whenReady().then(() => {
    configureAutoUpdater();
    createConfiguredWindows();
});

app.on("before-quit", () => {
    shutdownOwnedTerminalStack();
});

app.on("window-all-closed", () => {
    app.quit();
});

/* ===================================================== */
/* WINDOW CONTROLS */
/* ===================================================== */

/* I pulsanti custom nell'HTML mandano eventi IPC qui. */
ipcMain.on("window-minimize", event => {
    const window = getActiveWindow(event);

    if (!window) {
        return;
    }

    window.webContents.send("animate-minimize");

    setTimeout(() => {
        window.minimize();
    }, 250);
});

ipcMain.on("window-maximize", event => {
    const window = getActiveWindow(event);

    if (!window) {
        return;
    }

    if (window.isMaximized()) {
        window.unmaximize();
    } else {
        window.maximize();
    }
});

ipcMain.on("window-close", event => {
    const window = getActiveWindow(event);

    if (window) {
        window.close();
    }
});

/* ===================================================== */
/* AUTH IPC: login locale con password hashata */
/* ===================================================== */

ipcMain.handle("auth-get-state", event => {
    const db = loadAuthDb();
    const currentUser = getAuthSessionUser(event);

    return okAuth({
        hasUsers: db.users.length > 0,
        currentUser: publicAuthUser(currentUser),
        dbPath: getAuthDbPath()
    });
});

ipcMain.handle("auth-create-account", (event, payload = {}) => {
    const db = loadAuthDb();
    const username = normalizeUsername(payload.username);
    const displayName = normalizeDisplayName(payload.displayName, username);
    const password = String(payload.password || "");
    const passwordError = validatePassword(password);

    if (username.length < 3) {
        return failAuth("Username must be 3-32 characters: letters, numbers, dot, dash or underscore.");
    }

    if (!displayName) {
        return failAuth("Display name is required.");
    }

    if (passwordError) {
        return failAuth(passwordError);
    }

    if (db.users.some(user => user.username === username)) {
        return failAuth("This username already exists.");
    }

    const currentUser = getAuthSessionUser(event);
    const requestedRole = payload.role === "admin" ? "admin" : "user";
    const role = db.users.length === 0
        ? "admin"
        : currentUser?.role === "admin"
            ? requestedRole
            : "user";
    const now = new Date().toISOString();
    const passwordData = hashPassword(password);
    const user = {
        username,
        displayName,
        role,
        disabled: false,
        salt: passwordData.salt,
        passwordHash: passwordData.hash,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        loginCount: 1,
        failedAttempts: 0,
        lockedUntil: 0
    };

    db.users.push(user);
    saveAuthDb(db);
    authSessions.set(event.sender.id, username);

    return okAuth({
        user: publicAuthUser(user),
        hasUsers: true,
        dbPath: getAuthDbPath(),
        message: role === "admin" ? "Admin account created." : "Account created."
    });
});

ipcMain.handle("auth-login", (event, payload = {}) => {
    const db = loadAuthDb();
    const username = normalizeUsername(payload.username);
    const password = String(payload.password || "");
    const user = db.users.find(item => item.username === username);
    const nowMs = Date.now();

    if (!user) {
        return failAuth("Invalid username or password.");
    }

    if (user.disabled) {
        return failAuth("This account is disabled.");
    }

    if (Number(user.lockedUntil || 0) > nowMs) {
        return failAuth("Too many attempts. Try again in a few minutes.");
    }

    if (!verifyPassword(password, user)) {
        user.failedAttempts = Number(user.failedAttempts || 0) + 1;
        if (user.failedAttempts >= AUTH_MAX_FAILED_ATTEMPTS) {
            user.lockedUntil = nowMs + AUTH_LOCK_MS;
        }
        user.updatedAt = new Date().toISOString();
        saveAuthDb(db);

        return failAuth("Invalid username or password.");
    }

    user.failedAttempts = 0;
    user.lockedUntil = 0;
    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = user.lastLoginAt;
    user.loginCount = Number(user.loginCount || 0) + 1;
    saveAuthDb(db);
    authSessions.set(event.sender.id, username);

    return okAuth({
        user: publicAuthUser(user),
        dbPath: getAuthDbPath(),
        message: "Login successful."
    });
});

ipcMain.handle("auth-logout", event => {
    authSessions.delete(event.sender.id);

    return okAuth({ message: "Logged out." });
});

ipcMain.handle("auth-list-users", event => {
    const currentUser = getAuthSessionUser(event);

    if (currentUser?.role !== "admin") {
        return failAuth("Admin access required.");
    }

    const db = loadAuthDb();

    return okAuth({
        users: db.users.map(publicAuthUser),
        dbPath: getAuthDbPath()
    });
});

ipcMain.handle("auth-update-user", (event, payload = {}) => {
    const currentUser = getAuthSessionUser(event);

    if (currentUser?.role !== "admin") {
        return failAuth("Admin access required.");
    }

    const db = loadAuthDb();
    const username = normalizeUsername(payload.username);
    const target = db.users.find(user => user.username === username);

    if (!target) {
        return failAuth("User not found.");
    }

    const nextRole = payload.role === "admin" ? "admin" : "user";
    const nextDisabled = Boolean(payload.disabled);
    const demotesLastAdmin = target.role === "admin" && nextRole !== "admin" && countActiveAdmins(db) <= 1;
    const disablesLastAdmin = target.role === "admin" && nextDisabled && countActiveAdmins(db) <= 1;

    if (demotesLastAdmin || disablesLastAdmin) {
        return failAuth("At least one active admin account is required.");
    }

    if (target.username === currentUser.username && nextDisabled) {
        return failAuth("You cannot disable your own active session.");
    }

    const newPassword = String(payload.newPassword || "");
    if (newPassword) {
        const passwordError = validatePassword(newPassword);

        if (passwordError) {
            return failAuth(passwordError);
        }

        const passwordData = hashPassword(newPassword);
        target.salt = passwordData.salt;
        target.passwordHash = passwordData.hash;
        target.failedAttempts = 0;
        target.lockedUntil = 0;
    }

    target.displayName = normalizeDisplayName(payload.displayName, target.username);
    target.role = nextRole;
    target.disabled = nextDisabled;
    target.updatedAt = new Date().toISOString();
    saveAuthDb(db);

    return okAuth({
        user: publicAuthUser(target),
        users: db.users.map(publicAuthUser),
        dbPath: getAuthDbPath(),
        message: "User updated."
    });
});

ipcMain.handle("auth-delete-user", (event, payload = {}) => {
    const currentUser = getAuthSessionUser(event);

    if (currentUser?.role !== "admin") {
        return failAuth("Admin access required.");
    }

    const db = loadAuthDb();
    const username = normalizeUsername(payload.username);
    const target = db.users.find(user => user.username === username);

    if (!target) {
        return failAuth("User not found.");
    }

    if (target.username === currentUser.username) {
        return failAuth("You cannot delete your own active account.");
    }

    if (target.role === "admin" && countActiveAdmins(db) <= 1) {
        return failAuth("At least one active admin account is required.");
    }

    db.users = db.users.filter(user => user.username !== username);
    for (const [sessionId, sessionUsername] of authSessions.entries()) {
        if (sessionUsername === username) {
            authSessions.delete(sessionId);
        }
    }
    saveAuthDb(db);

    return okAuth({
        users: db.users.map(publicAuthUser),
        dbPath: getAuthDbPath(),
        message: "User deleted."
    });
});

/* ===================================================== */
/* SYSTEM INFORMATION */
/* ===================================================== */

/* Renderer chiede dati macchina; main process risponde. */
ipcMain.handle("get-system-info", async () => {
    const totalMemoryBytes = os.totalmem();
    const freeMemoryBytes = os.freemem();
    const usedMemoryBytes = totalMemoryBytes - freeMemoryBytes;

    return {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        cpuModel: os.cpus()[0]?.model || "CPU",
        cpu: getCpuUsage(),
        ram: Math.round((usedMemoryBytes / totalMemoryBytes) * 100),
        freeRam: roundGb(freeMemoryBytes),
        usedRam: roundGb(usedMemoryBytes),
        totalRam: roundGb(totalMemoryBytes),
        uptime: Math.floor(os.uptime() / 60),
        ip: getLocalIpAddress()
    };
});

function roundGb(bytes) {
    return Math.round((bytes / 1024 / 1024 / 1024) * 10) / 10;
}

function getCpuUsage() {
    const totals = os.cpus().reduce((acc, cpu) => {
        const times = cpu.times;

        acc.idle += times.idle;
        acc.total += times.user + times.nice + times.sys + times.idle + times.irq;

        return acc;
    }, { idle: 0, total: 0 });

    if (!previousCpuTimes) {
        previousCpuTimes = totals;
        return 0;
    }

    const idleDelta = totals.idle - previousCpuTimes.idle;
    const totalDelta = totals.total - previousCpuTimes.total;
    previousCpuTimes = totals;

    if (totalDelta <= 0) {
        return 0;
    }

    return Math.round((1 - idleDelta / totalDelta) * 100);
}

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();

    for (const entries of Object.values(interfaces)) {
        for (const entry of entries || []) {
            if (entry.family === "IPv4" && !entry.internal) {
                return entry.address;
            }
        }
    }

    return "Not connected";
}

/* ===================================================== */
/* SECURITY STATUS */
/* ===================================================== */

/* Stato sintetico: usa dati host all'avvio; WSL parte solo su richiesta. */
ipcMain.handle("get-security-status", async () => {
    return {
        firewall: "HOST",
        vpn: "LOCAL",
        protection: "HOST"
    };
});

/* ===================================================== */
/* TOP PROCESSES */
/* ===================================================== */

/* Legge i processi Windows piu pesanti senza avviare WSL. */
ipcMain.handle("get-top-processes", async () => {
    try {
        const result = await execFilePromise(
            "powershell.exe",
            [
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 6 ProcessName,@{Name='RAM';Expression={[math]::Round($_.WorkingSet64/1MB)}} | ConvertTo-Json -Compress"
            ],
            {
                encoding: "utf8",
                windowsHide: true,
                timeout: 8000,
                maxBuffer: 1024 * 1024
            }
        );
        const rows = JSON.parse(result.stdout || "[]");
        const list = Array.isArray(rows) ? rows : [rows];

        return list.map(item => ({
            ProcessName: item.ProcessName || "process",
            RAM: Number(item.RAM || 0)
        }));
    } catch {
        return [];
    }
});

/* ===================================================== */
/* NETWORK DETAILS */
/* ===================================================== */

/* Restituisce le interfacce host senza avviare WSL. */
ipcMain.handle("get-network-details", async () => {
    const interfaces = os.networkInterfaces();
    const rows = [];

    Object.entries(interfaces).forEach(([name, entries]) => {
        (entries || []).forEach(entry => {
            if (entry.family !== "IPv4" || entry.internal) {
                return;
            }

            rows.push({
                InterfaceAlias: name,
                InterfaceDescription: "Windows host interface",
                IPAddress: entry.address,
                Gateway: ""
            });
        });
    });

    return rows;
});

/* ===================================================== */
/* SAFE COMMANDS: comandi consentiti dal terminale interno */
/* ===================================================== */

/* Qui non accettiamo comandi liberi: solo diagnostica locale sicura su WSL. */
const SAFE_COMMANDS = {
    "ping-localhost": "ping -c 4 127.0.0.1"
};

ipcMain.handle("run-safe-command", async (event, commandId) => {
    const command = SAFE_COMMANDS[commandId];

    if (!command) {
        return {
            output: "Command blocked: not in safe command list."
        };
    }

    try {
        return {
            output: await runWslCommand(command)
        };
    } catch (error) {
        return {
            output: String(error.stdout || error.stderr || error.message || "Safe command failed.")
        };
    }
});

/* ===================================================== */
/* REAL TERMINAL: bridge verso Kali WSL */
/* ===================================================== */

/* Avvia una shell reale e collega stdout/stderr alla finestra Electron. */
ipcMain.on("terminal-start", (event, requestedMode) => {
    startEmbeddedTerminal(requestedMode);
});

ipcMain.on("terminal-stop", () => {
    shutdownOwnedTerminalStack();
    sendTerminalStatus("offline", "terminal stopped");
});

ipcMain.on("terminal-interrupt", () => {
    if (terminalProcess && !terminalProcess.killed && terminalProcess.stdin.writable) {
        terminalProcess.stdin.write("\x03");
        sendTerminalStatus("online", `${getTerminalLabel(terminalMode)} interrupt sent`);
    }
});

/* Scrive nella stdin della shell attiva. */
ipcMain.on("terminal-input", (event, input) => {
    if (!terminalProcess || terminalProcess.killed || !terminalProcess.stdin.writable) {
        sendTerminalStatus("offline", "terminal offline");
        return;
    }

    terminalProcess.stdin.write(String(input || ""));
});

async function startEmbeddedTerminal(requestedMode = "wsl") {
    shutdownOwnedTerminalStack();

    terminalMode = normalizeTerminalMode(requestedMode);

    const config = await getTerminalConfig(terminalMode);

    try {
        rememberOwnedWslSession(config);

        terminalProcess = spawn(config.command, config.args, {
            cwd: os.homedir(),
            env: {
                ...process.env,
                TERM: "xterm-256color"
            },
            windowsHide: true
        });

        const activeProcess = terminalProcess;

        sendTerminalStatus("online", `${config.label} online`);

        activeProcess.stdout.on("data", chunk => {
            sendTerminalOutput(chunk, "stdout");
        });

        activeProcess.stderr.on("data", chunk => {
            sendTerminalOutput(chunk, "stderr");
        });

        activeProcess.on("error", error => {
            sendTerminalOutput(
                `${config.label} failed: ${error.message}\n`,
                "stderr"
            );
            sendTerminalStatus("error", `${config.label} unavailable`);
        });

        activeProcess.on("exit", code => {
            if (terminalProcess !== activeProcess) {
                return;
            }

            sendTerminalOutput(
                `${config.label} exited with code ${code ?? "unknown"}\n`,
                "stderr"
            );
            sendTerminalStatus("offline", `${config.label} offline`);
            terminalProcess = null;
        });
    } catch (error) {
        sendTerminalOutput(`${config.label} failed: ${error.message}\n`, "stderr");
        sendTerminalStatus("error", `${config.label} unavailable`);
    }
}

function stopEmbeddedTerminal() {
    if (!terminalProcess) {
        return;
    }

    try {
        if (terminalProcess.stdin?.writable) {
            terminalProcess.stdin.end();
        }
        terminalProcess.kill();
    } catch {}

    terminalProcess = null;
}

/* Ricorda solo la sessione WSL aperta da CyberDesk: la chiusura non tocca altro. */
function rememberOwnedWslSession(config) {
    if (terminalMode !== "wsl") {
        return;
    }

    ownedWslDistroName = config.wslDistroName || null;
    ownedDefaultWslSession = !ownedWslDistroName;
}

/* Quando l'app si chiude, spegne anche l'eventuale WSL avviato dal terminale interno. */
function shutdownOwnedTerminalStack() {
    stopEmbeddedTerminal();
    terminateOwnedWslDistro();
}

/* Termina Kali/WSL solo se CyberDesk lo ha avviato: niente finestre debug appese. */
function terminateOwnedWslDistro() {
    try {
        if (ownedWslDistroName) {
            execFileSync("wsl.exe", ["--terminate", ownedWslDistroName], {
                windowsHide: true,
                timeout: 5000,
                stdio: "ignore"
            });
            ownedWslDistroName = null;
            ownedDefaultWslSession = false;
            return;
        }

        if (ownedDefaultWslSession) {
            execFileSync("wsl.exe", ["--shutdown"], {
                windowsHide: true,
                timeout: 5000,
                stdio: "ignore"
            });
            ownedDefaultWslSession = false;
        }
    } catch {
        ownedWslDistroName = null;
        ownedDefaultWslSession = false;
    }
}

function normalizeTerminalMode(mode) {
    return ["wsl", "powershell", "cmd"].includes(mode) ? mode : "wsl";
}

function getTerminalLabel(mode) {
    const labels = {
        wsl: "Kali WSL",
        powershell: "Windows PowerShell",
        cmd: "Windows CMD"
    };

    return labels[normalizeTerminalMode(mode)] || "Terminal";
}

async function getTerminalConfig(mode = "wsl") {
    if (mode === "powershell") {
        return {
            label: "Windows PowerShell",
            command: "powershell.exe",
            args: ["-NoLogo", "-NoExit", "-ExecutionPolicy", "Bypass"]
        };
    }

    if (mode === "cmd") {
        return {
            label: "Windows CMD",
            command: "cmd.exe",
            args: ["/Q", "/K", "prompt $P$G"]
        };
    }

    const kaliArgs = await getKaliWslArgs();
    const wslDistroName = kaliArgs[0] === "-d" ? kaliArgs[1] : "";

    return {
        label: wslDistroName ? `Kali WSL (${wslDistroName})` : "WSL Linux",
        command: "wsl.exe",
        args: kaliArgs,
        wslDistroName
    };
}

async function getKaliWslArgs() {
    if (cachedKaliArgs) {
        return cachedKaliArgs;
    }

    try {
        const result = await execFilePromise("wsl.exe", ["-l", "-q"], {
            encoding: "buffer",
            windowsHide: true
        });

        const distros = decodeProcessText(result.stdout)
            .replace(/\0/g, "")
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);

        const kali = distros.find(name => /kali/i.test(name));

        cachedKaliArgs = kali ? ["-d", kali] : [];
        return cachedKaliArgs;
    } catch {
        cachedKaliArgs = [];
        return cachedKaliArgs;
    }
}

async function runWslCommand(command) {
    const kaliArgs = await getKaliWslArgs();
    const distroName = kaliArgs[0] === "-d" ? kaliArgs[1] : "";

    ownedWslDistroName = distroName || ownedWslDistroName;
    ownedDefaultWslSession = !distroName;

    const result = await execFilePromise(
        "wsl.exe",
        [...kaliArgs, "--", "bash", "-lc", command],
        {
            encoding: "buffer",
            timeout: 12000,
            windowsHide: true,
            maxBuffer: 1024 * 1024
        }
    );

    return decodeProcessText(result.stdout).trim();
}

function sendTerminalOutput(chunk, stream) {
    broadcastToRenderers("terminal-output", {
        data: decodeProcessText(chunk),
        stream
    });
}

function decodeProcessText(value) {
    if (Buffer.isBuffer(value)) {
        const utf8 = value.toString("utf8");
        const nullCount = (utf8.match(/\u0000/g) || []).length;

        if (nullCount > Math.max(2, utf8.length / 8)) {
            return value.toString("utf16le").replace(/\u0000/g, "");
        }

        return utf8.replace(/\u0000/g, "");
    }

    return String(value || "").replace(/\u0000/g, "");
}

function sendTerminalStatus(status, message) {
    broadcastToRenderers("terminal-status", {
        status,
        message
    });
}

/* ===================================================== */
/* SEARCH: ricerca locale sicura tramite WSL find */
/* ===================================================== */

async function runMatrixSearch(payload) {
    const root = sanitizeWslRoot(payload?.root);
    const query = sanitizeSearchQuery(payload?.query);

    if (!query) {
        return {
            output: ""
        };
    }

    const pattern = query.includes("*") ? query : `*${query}*`;
    const command = [
        "timeout 12s",
        "find",
        shellQuote(root),
        "-maxdepth 6",
        "-iname",
        shellQuote(pattern),
        "2>/dev/null",
        "|",
        "head -80"
    ].join(" ");

    try {
        const kaliArgs = await getKaliWslArgs();
        const result = await execFilePromise(
            "wsl.exe",
            [...kaliArgs, "--", "bash", "-lc", command],
            {
                encoding: "buffer",
                timeout: 14000,
                windowsHide: true,
                maxBuffer: 1024 * 1024
            }
        );

        return {
            output: decodeProcessText(result.stdout).trim()
        };
    } catch (error) {
        return {
            output: decodeProcessText(error.stdout || error.stderr || error.message || "").trim()
        };
    }
}

ipcMain.handle("search", async (event, payload) => {
    return runMatrixSearch(payload);
});

ipcMain.handle("matrix-search", async (event, payload) => {
    return runMatrixSearch(payload);
});

function sanitizeWslRoot(value) {
    const root = String(value || "/mnt/c/Users/steal").trim();

    if (!root.startsWith("/")) {
        return "/mnt/c/Users/steal";
    }

    return root.slice(0, 180);
}

function sanitizeSearchQuery(value) {
    return String(value || "")
        .replace(/[^a-zA-Z0-9._* -]/g, "")
        .trim()
        .slice(0, 90);
}

function shellQuote(value) {
    return `'${String(value).replace(/'/g, "'\"'\"'")}'`;
}

/* ===================================================== */
/* DISPLAY MODE: apri CyberDesk su monitor singolo o multipli */
/* ===================================================== */

ipcMain.handle("get-display-mode", async () => {
    return {
        ...loadAppConfig(),
        displayCount: screen.getAllDisplays().length
    };
});

ipcMain.on("set-display-mode", (event, mode) => {
    syncDisplayMode(mode);
});

/* ===================================================== */
/* APP UPDATES: feed statico + download/install dentro CyberDesk */
/* ===================================================== */

function configureAutoUpdater() {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("checking-for-update", () => {
        setUpdateState({
            status: "checking",
            message: "Checking for CyberDesk updates.",
            available: false,
            downloaded: false,
            progress: null
        });
    });

    autoUpdater.on("update-available", info => {
        setUpdateState({
            status: "available",
            message: `Update ${info?.version || ""} available.`,
            version: info?.version || null,
            available: true,
            downloaded: false,
            progress: null
        });
    });

    autoUpdater.on("update-not-available", info => {
        setUpdateState({
            status: "current",
            message: "CyberDesk is already up to date.",
            version: info?.version || app.getVersion(),
            available: false,
            downloaded: false,
            progress: null
        });
    });

    autoUpdater.on("download-progress", progress => {
        const percent = Number(progress?.percent || 0);

        setUpdateState({
            status: "downloading",
            message: `Downloading update ${Math.round(percent)}%.`,
            available: true,
            downloaded: false,
            progress: {
                percent,
                transferred: progress?.transferred || 0,
                total: progress?.total || 0
            }
        });
    });

    autoUpdater.on("update-downloaded", info => {
        setUpdateState({
            status: "downloaded",
            message: `Update ${info?.version || ""} ready to install.`,
            version: info?.version || null,
            available: true,
            downloaded: true,
            progress: { percent: 100 }
        });
    });

    autoUpdater.on("error", error => {
        setUpdateState({
            status: "error",
            message: error?.message || String(error),
            progress: null
        });
    });

    const feedUrl = normalizeUpdateFeedUrl(loadAppConfig().updateFeedUrl);

    applyUpdateFeed(feedUrl);
}

function normalizeUpdateFeedUrl(feedUrl) {
    let url = String(feedUrl || "").trim();

    if (!url) {
        return "";
    }

    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
        url = `https://${url}`;
    }

    return url.replace(/\/+$/, "");
}

function applyUpdateFeed(feedUrl) {
    const normalizedFeedUrl = normalizeUpdateFeedUrl(feedUrl);
    const effectiveFeedUrl = normalizedFeedUrl || getPackagedUpdateFeedUrl();

    if (effectiveFeedUrl) {
        autoUpdater.setFeedURL({
            provider: "generic",
            url: effectiveFeedUrl
        });
    }

    setUpdateState({
        feedUrl: normalizedFeedUrl,
        effectiveFeedUrl
    });

    return normalizedFeedUrl;
}

function getPackagedUpdateFeedUrl() {
    try {
        const manifest = require(path.join(__dirname, "..", "package.json"));
        const publishConfig = Array.isArray(manifest?.build?.publish)
            ? manifest.build.publish
            : [manifest?.build?.publish].filter(Boolean);
        const genericConfig = publishConfig.find(config => config?.provider === "generic" && config?.url);

        return normalizeUpdateFeedUrl(genericConfig?.url);
    } catch {
        return "";
    }
}

function setUpdateState(nextState) {
    updateState = {
        ...updateState,
        ...nextState,
        currentVersion: app.getVersion()
    };

    broadcastToRenderers("update-status", updateState);

    return updateState;
}

function saveUpdateFeedUrl(feedUrl) {
    const normalizedFeedUrl = normalizeUpdateFeedUrl(feedUrl);
    const config = {
        ...loadAppConfig(),
        updateFeedUrl: normalizedFeedUrl
    };

    saveAppConfig(config);
    applyUpdateFeed(normalizedFeedUrl);

    return normalizedFeedUrl;
}

ipcMain.handle("get-update-status", async () => {
    const feedUrl = normalizeUpdateFeedUrl(loadAppConfig().updateFeedUrl);

    return {
        ...updateState,
        feedUrl
    };
});

ipcMain.handle("set-update-feed", async (event, feedUrl) => {
    const normalizedFeedUrl = saveUpdateFeedUrl(feedUrl);

    return setUpdateState({
        status: "idle",
        message: normalizedFeedUrl ? "Update feed saved." : "Update feed cleared.",
        feedUrl: normalizedFeedUrl,
        progress: null
    });
});

ipcMain.handle("check-for-updates", async (event, feedUrl) => {
    if (typeof feedUrl === "string") {
        saveUpdateFeedUrl(feedUrl);
    }

    if (!app.isPackaged) {
        return setUpdateState({
            status: "dev",
            message: "Updater checks work from the installed app build.",
            progress: null
        });
    }

    try {
        await autoUpdater.checkForUpdates();
    } catch (error) {
        setUpdateState({
            status: "error",
            message: error?.message || String(error),
            progress: null
        });
    }

    return updateState;
});

ipcMain.handle("download-update", async () => {
    if (!app.isPackaged) {
        return setUpdateState({
            status: "dev",
            message: "Update downloads work from the installed app build.",
            progress: null
        });
    }

    if (!updateState.available) {
        return setUpdateState({
            status: "idle",
            message: "No update is available yet.",
            progress: null
        });
    }

    try {
        await autoUpdater.downloadUpdate();
    } catch (error) {
        setUpdateState({
            status: "error",
            message: error?.message || String(error),
            progress: null
        });
    }

    return updateState;
});

ipcMain.handle("install-update", async () => {
    if (!updateState.downloaded) {
        return setUpdateState({
            status: "idle",
            message: "No downloaded update is ready to install.",
            progress: null
        });
    }

    autoUpdater.quitAndInstall(false, true);

    return updateState;
});

/* ===================================================== */
/* APPLICATION TOOLS */
/* ===================================================== */

/* ===================================================== */
/* OPEN HELPERS: separano link, cartelle e comandi app */
/* ===================================================== */

/* Apre un link nel browser predefinito. */
function openExternalUrl(target) {
    let url = String(target || "").trim();

    if (!url) {
        return;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
        url = `https://${url}`;
    }

    shell.openExternal(url);
}

/* Apre una cartella o file locale con il sistema operativo. */
function openLocalPath(target) {
    const localTarget = String(target || "").trim();

    if (!localTarget) {
        return;
    }

    shell.openPath(localTarget);
}

/* Avvia un comando o apre direttamente un eseguibile/percorso. */
function openAppCommand(target) {
    const command = String(target || "").trim();

    if (!command) {
        return;
    }

    const looksLikePath =
        /^[a-zA-Z]:[\\/]/.test(command) ||
        command.startsWith("\\\\");

    if (looksLikePath) {
        shell.openPath(command);
        return;
    }

    exec(command);
}

/* ===================================================== */
/* CORE LAUNCHER: app/cartelle gia previste da CyberDesk Ethical OS */
/* ===================================================== */

ipcMain.on("open-tool", (event, tool) => {
    const links = {
        github: "https://github.com",
        whatsapp: "https://web.whatsapp.com",
        protonMail: "https://mail.proton.me",
        protonPass: "https://pass.proton.me",
        maps: "https://www.google.com/maps",
        openstreetmap: "https://www.openstreetmap.org",
        youtube: "https://www.youtube.com"
    };

    if (links[tool]) {
        openExternalUrl(links[tool]);
        return;
    }

    if (tool === "vscode") {
        exec("code");
        return;
    }

    if (tool === "explorer") {
        openLocalPath(os.homedir());
        return;
    }

    if (tool === "taskmgr") {
        exec("taskmgr");
        return;
    }

    if (tool === "control") {
        exec("control");
        return;
    }

    if (tool === "wsl") {
        // WSL viene avviato dal terminale integrato, non da una finestra esterna.
        return;
    }

    if (tool === "apps") {
        openLocalPath("C:\\Users\\steal\\Proton Drive\\stealthpulseX9\\My files\\LAPO - PERSONALE\\BENI\\ELETTRONICA\\STUDIO\\PC-STUDIO\\APPLICAZIONI");
        return;
    }

    if (tool === "games") {
        openLocalPath("C:\\Users\\steal\\Proton Drive\\stealthpulseX9\\My files\\LAPO - PERSONALE\\BENI\\ELETTRONICA\\STUDIO\\PC-STUDIO\\GIOCHI");
    }
});

/* ===================================================== */
/* CUSTOM LAUNCHER: app/cartelle/link creati da Settings */
/* ===================================================== */

ipcMain.on("open-custom-entry", (event, entry) => {
    if (!entry || typeof entry !== "object") {
        return;
    }

    const kind = String(entry.kind || "url");
    const target = String(entry.target || "").trim();

    if (!target) {
        return;
    }

    if (kind === "url") {
        openExternalUrl(target);
        return;
    }

    if (kind === "folder") {
        openLocalPath(target);
        return;
    }

    if (kind === "app") {
        openAppCommand(target);
    }
});
