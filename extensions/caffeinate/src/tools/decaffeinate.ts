import { stopCaffeinate, getSchedule, isCaffeinateRunning } from "../utils";

/**
 * Turns off caffeination, allowing your Windows PC to go to sleep normally
 */
export default async function () {
  // Check if not caffeinated
  if (!isCaffeinateRunning()) {
    return "Windows PC is already decaffeinated (normal sleep settings apply)";
  }

  const schedule = await getSchedule();
  if (schedule?.IsRunning) {
    throw new Error("Cannot decaffeinate while a schedule is running. Please pause the schedule first.");
  }

  await stopCaffeinate({ status: true }, undefined);

  return "Windows PC sleep prevention has been disabled";
}
