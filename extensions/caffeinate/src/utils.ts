import { launchCommand, LaunchType, LocalStorage, showHUD, environment } from "@raycast/api";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

type Updates = {
  status: boolean;
};

export interface Schedule {
  day: string;
  from: string;
  to: string;
  IsManuallyDecafed: boolean;
  IsRunning: boolean;
}

export interface CaffeinateInfo {
  pid: number;
  startTime: number;
  duration?: number;
  watchPid?: number;
}

// Use a reliable path - either Raycast support path or user's temp folder
function getSupportPath(): string {
  try {
    // Try Raycast's support path first
    if (environment.supportPath && fs.existsSync(path.dirname(environment.supportPath))) {
      if (!fs.existsSync(environment.supportPath)) {
        fs.mkdirSync(environment.supportPath, { recursive: true });
      }
      return environment.supportPath;
    }
  } catch {
    // Fallback to temp
  }

  // Fallback to a dedicated folder in temp
  const tempPath = path.join(os.tmpdir(), "raycast-coffee");
  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath, { recursive: true });
  }
  return tempPath;
}

function getInfoFilePath(): string {
  return path.join(getSupportPath(), "caffeinate-info.json");
}

function getScriptPath(): string {
  return path.join(getSupportPath(), "CoffeeAwake.ps1");
}

// PowerShell script content
const SCRIPT_CONTENT = `
param([int]$Duration = 0, [int]$WatchPid = 0, [int]$Interval = 30)

Add-Type -AssemblyName System.Windows.Forms

$signature = @'
[DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
public static extern uint SetThreadExecutionState(uint esFlags);
'@

try {
    $Kernel32 = Add-Type -MemberDefinition $signature -Name "Kernel32" -Namespace "Win32" -PassThru -ErrorAction SilentlyContinue
    $state = [uint32]0x80000000 -bor [uint32]0x00000001 -bor [uint32]0x00000002
    $null = $Kernel32::SetThreadExecutionState($state)
} catch {}

$startTime = Get-Date
$endTime = if ($Duration -gt 0) { $startTime.AddSeconds($Duration) } else { $null }

try {
    while ($true) {
        if ($endTime -ne $null -and (Get-Date) -ge $endTime) { break }
        if ($WatchPid -gt 0) {
            try { Get-Process -Id $WatchPid -ErrorAction Stop | Out-Null }
            catch { break }
        }
        [System.Windows.Forms.SendKeys]::SendWait("{F15}")
        try { $null = $Kernel32::SetThreadExecutionState($state) } catch {}
        Start-Sleep -Seconds $Interval
    }
} finally {
    try { $null = $Kernel32::SetThreadExecutionState([uint32]0x80000000) } catch {}
}
`;

// Save caffeinate process info
function saveCaffeinateInfo(info: CaffeinateInfo): void {
  try {
    fs.writeFileSync(getInfoFilePath(), JSON.stringify(info), "utf-8");
  } catch (e) {
    console.error("Failed to save caffeinate info:", e);
  }
}

// Load caffeinate process info
export function loadCaffeinateInfo(): CaffeinateInfo | null {
  try {
    const filePath = getInfoFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data) as CaffeinateInfo;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

// Clear caffeinate process info
function clearCaffeinateInfo(): void {
  try {
    const filePath = getInfoFilePath();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore errors
  }
}

// Check if a specific process ID is running
function isProcessAlive(pid: number): boolean {
  try {
    const result = execSync(`tasklist /FI "PID eq ${pid}" /NH 2>nul`, {
      encoding: "utf-8",
      windowsHide: true,
      timeout: 5000,
    });
    return result.includes(String(pid)) && !result.toLowerCase().includes("no tasks");
  } catch {
    return false;
  }
}

// Check if our caffeinate script is running
export function isCaffeinateRunning(): boolean {
  const info = loadCaffeinateInfo();
  if (!info) return false;

  if (isProcessAlive(info.pid)) {
    return true;
  }

  clearCaffeinateInfo();
  return false;
}

// Get remaining time for caffeinate
export function getCaffeinateRemainingTime(): number | null {
  const info = loadCaffeinateInfo();
  if (!info) return null;

  if (!isCaffeinateRunning()) return null;

  if (!info.duration) return null;

  const elapsed = Math.floor((Date.now() - info.startTime) / 1000);
  const remaining = info.duration - elapsed;

  return remaining > 0 ? remaining : 0;
}

// Kill any running caffeinate processes
function killCaffeinateProcesses(): void {
  const info = loadCaffeinateInfo();

  if (info && info.pid) {
    try {
      execSync(`taskkill /PID ${info.pid} /F /T 2>nul`, {
        encoding: "utf-8",
        windowsHide: true,
        timeout: 5000,
      });
    } catch {
      // Process may already be dead
    }
  }

  clearCaffeinateInfo();
}

// Create the script file
function ensureScriptExists(): string {
  const scriptPath = getScriptPath();
  try {
    fs.writeFileSync(scriptPath, SCRIPT_CONTENT, "utf-8");
  } catch (e) {
    console.error("Failed to write script:", e);
    throw e;
  }
  return scriptPath;
}

export async function startCaffeinate(
  updates: Updates,
  hudMessage?: string,
  options?: { duration?: number; watchPid?: number },
) {
  // Check if already running
  if (isCaffeinateRunning()) {
    if (hudMessage) {
      await showHUD("☕ Your Windows PC is already caffeinated!");
    }
    await update(updates, true);
    return;
  }

  // Clean up any orphans
  killCaffeinateProcesses();

  if (hudMessage) {
    await showHUD(hudMessage);
  }

  try {
    // Ensure script exists
    const scriptPath = ensureScriptExists();

    const duration = options?.duration || 0;
    const watchPid = options?.watchPid || 0;
    const interval = 30;

    // Build PowerShell command - use double quotes for the outer command
    // and escape inner quotes properly
    const escapedPath = scriptPath.replace(/'/g, "''");

    const psCommand = `$proc = Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', '${escapedPath}', '-Duration', '${duration}', '-WatchPid', '${watchPid}', '-Interval', '${interval}' -WindowStyle Hidden -PassThru; $proc.Id`;

    // Execute PowerShell command
    const result = execSync(`powershell.exe -NoProfile -Command "${psCommand}"`, {
      encoding: "utf-8",
      windowsHide: true,
      timeout: 15000,
    });

    const procPid = parseInt(result.trim(), 10);

    if (isNaN(procPid) || procPid <= 0) {
      console.error("Invalid PID:", result);
      await showHUD("❌ Failed to start caffeinate");
      return;
    }

    // Save the process info
    const info: CaffeinateInfo = {
      pid: procPid,
      startTime: Date.now(),
      duration: options?.duration,
      watchPid: options?.watchPid,
    };
    saveCaffeinateInfo(info);

    // Wait a bit for process to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify process is running
    if (!isProcessAlive(procPid)) {
      console.error("Process died after start:", procPid);
      await showHUD("❌ Caffeinate process died after start");
      clearCaffeinateInfo();
      return;
    }

    await update(updates, true);
  } catch (e) {
    console.error("Failed to start caffeinate:", e);
    const errorMsg = e instanceof Error ? e.message : String(e);
    await showHUD(`❌ Failed: ${errorMsg.substring(0, 50)}`);
  }
}

export async function stopCaffeinate(updates: Updates, hudMessage?: string) {
  if (hudMessage) {
    await showHUD(hudMessage);
  }

  killCaffeinateProcesses();

  await update(updates, false);
}

async function update(updates: Updates, caffeinated: boolean) {
  if (updates.status) {
    await tryLaunchCommand("status", { caffeinated });
  }
}

async function tryLaunchCommand(commandName: string, context: { caffeinated: boolean }) {
  try {
    await launchCommand({ name: commandName, type: LaunchType.Background, context });
  } catch {
    // Handle error if command is not enabled
  }
}

export function numberToDayString(dayIndex: number): string {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return daysOfWeek[dayIndex];
}

export async function getSchedule() {
  const currentDate = new Date();
  const currentDayString = numberToDayString(currentDate.getDay()).toLowerCase();

  const storedSchedule: string | undefined = await LocalStorage.getItem(currentDayString);
  if (storedSchedule === undefined) return undefined;

  const schedule: Schedule = JSON.parse(storedSchedule);
  return schedule;
}

export async function changeScheduleState(operation: string, schedule: Schedule) {
  switch (operation) {
    case "caffeinate": {
      schedule.IsManuallyDecafed = false;
      schedule.IsRunning = false;
      await LocalStorage.setItem(schedule.day, JSON.stringify(schedule));
      break;
    }
    case "decaffeinate": {
      if (schedule.IsRunning === true || isNotTodaysSchedule(schedule)) {
        schedule.IsManuallyDecafed = true;
        schedule.IsRunning = false;
        await LocalStorage.setItem(schedule.day, JSON.stringify(schedule));
      }
      break;
    }
    default:
      break;
  }
}

export function isTodaysSchedule(schedule: Schedule) {
  const currentDate = new Date();
  const currentDayString = numberToDayString(currentDate.getDay()).toLowerCase();
  return schedule.day === currentDayString;
}

export function isNotTodaysSchedule(schedule: Schedule) {
  return !isTodaysSchedule(schedule);
}

export function formatDuration(seconds: number): string {
  const units = [
    { label: "d", value: 86400 },
    { label: "h", value: 3600 },
    { label: "m", value: 60 },
    { label: "s", value: 1 },
  ];

  const result: string[] = [];

  for (const unit of units) {
    const amount = Math.floor(seconds / unit.value);
    seconds %= unit.value;
    if (amount > 0) {
      result.push(`${amount}${unit.label}`);
    }
  }

  return result.join(" ");
}

// Get running Windows processes with visible windows
export async function getRunningProcesses(): Promise<{ name: string; pid: number }[]> {
  try {
    const result = execSync(
      "powershell.exe -NoProfile -Command \"Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object -Property Name, Id | ConvertTo-Csv -NoTypeInformation\"",
      { encoding: "utf-8", windowsHide: true, maxBuffer: 10 * 1024 * 1024, timeout: 30000 },
    );

    const lines = result.trim().split("\n");
    const processes: { name: string; pid: number }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].replace(/"/g, "").trim();
      if (!line) continue;

      const parts = line.split(",");
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const pid = parseInt(parts[1].trim(), 10);
        if (name && !isNaN(pid)) {
          processes.push({ name, pid });
        }
      }
    }

    const seen = new Set<string>();
    return processes.filter((p) => {
      const lower = p.name.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  } catch {
    return [];
  }
}

export function findProcessByName(
  processes: { name: string; pid: number }[],
  appName: string,
): { name: string; pid: number } | undefined {
  const lowerAppName = appName.toLowerCase();

  let match = processes.find((p) => p.name.toLowerCase() === lowerAppName);
  if (match) return match;

  match = processes.find(
    (p) => p.name.toLowerCase().includes(lowerAppName) || lowerAppName.includes(p.name.toLowerCase()),
  );

  return match;
}

export function isProcessRunning(pid: number): boolean {
  return isProcessAlive(pid);
}
