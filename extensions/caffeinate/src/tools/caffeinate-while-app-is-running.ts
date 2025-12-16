import { startCaffeinate, getRunningProcesses, findProcessByName, isCaffeinateRunning, stopCaffeinate } from "../utils";

type Input = {
  /**
   * Name of the application to watch (e.g., "Chrome", "VS Code", "Discord")
   */
  application: string;
};

/**
 * Prevents your Windows PC from sleeping while a specific application is running
 */
export default async function (input: Input) {
  const { application } = input;

  // Get all running processes
  const processes = await getRunningProcesses();

  // Find the process for the requested application
  const process = findProcessByName(processes, application);
  if (!process) {
    // List some available applications to help the user
    const availableApps = processes
      .slice(0, 5)
      .map((p) => p.name)
      .join(", ");
    throw new Error(
      `Application "${application}" is not currently running. Available applications include: ${availableApps}`,
    );
  }

  // If already caffeinated, stop first
  if (isCaffeinateRunning()) {
    await stopCaffeinate({ status: false });
  }

  await startCaffeinate({ status: true }, undefined, { watchPid: process.pid });

  return `Windows PC will stay awake while ${process.name} is running`;
}
