import { startCaffeinate, isCaffeinateRunning } from "../utils";

/**
 * Prevents your Windows PC from going to sleep indefinitely until manually disabled
 */
export default async function () {
  // Check if already caffeinated
  if (isCaffeinateRunning()) {
    return "Windows PC is already caffeinated (sleep prevention is active)";
  }

  await startCaffeinate({ status: true }, undefined);

  return "Windows PC will stay awake until you manually disable it";
}
