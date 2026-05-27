import { documentDirectory, getInfoAsync, writeAsStringAsync, readAsStringAsync } from 'expo-file-system/legacy';

const logFilePath = documentDirectory ? `${documentDirectory}app_debug.log` : '';

export const logError = async (message: string, error?: any, devMode: boolean = false) => {
  if (!devMode) return;
  const timestamp = new Date().toISOString();
  let errorMsg = typeof error === 'object' ? JSON.stringify(error) : String(error || '');
  const logEntry = `[ERROR] ${timestamp}: ${message} ${errorMsg}\n`;
  console.error(logEntry);
  await appendLog(logEntry);
};

export const logInfo = async (message: string, devMode: boolean = false) => {
  if (!devMode) return;
  const timestamp = new Date().toISOString();
  const logEntry = `[INFO] ${timestamp}: ${message}\n`;
  console.log(logEntry);
  await appendLog(logEntry);
};

const appendLog = async (logEntry: string) => {
  if (!logFilePath) return;
  try {
    const fileInfo = await getInfoAsync(logFilePath);
    if (!fileInfo.exists) {
      await writeAsStringAsync(logFilePath, logEntry);
    } else {
      const currentLogs = await readAsStringAsync(logFilePath);
      // Keep logs manageable (e.g. max 50KB roughly)
      if (currentLogs.length > 50000) {
         await writeAsStringAsync(logFilePath, logEntry);
      } else {
         await writeAsStringAsync(logFilePath, currentLogs + logEntry);
      }
    }
  } catch (e) {
    console.error('Failed to write to log file:', e);
  }
};

export const getLogs = async (): Promise<string> => {
  if (!logFilePath) return 'No log file path available.';
  try {
    const fileInfo = await getInfoAsync(logFilePath);
    if (!fileInfo.exists) return 'No logs found.';
    return await readAsStringAsync(logFilePath);
  } catch (e) {
    return `Failed to read logs: ${e}`;
  }
};

export const clearLogs = async () => {
  if (!logFilePath) return;
  try {
    await writeAsStringAsync(logFilePath, '');
  } catch (e) {
    console.error('Failed to clear logs:', e);
  }
};
