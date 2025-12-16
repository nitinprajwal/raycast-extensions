import { isCaffeinateRunning, getCaffeinateRemainingTime, loadCaffeinateInfo, formatDuration } from "../utils";
import { checkSchedule } from "../status";

/**
 * Checks if your Windows PC is currently prevented from sleeping
 */
export default async function () {
  const isProcessRunning = isCaffeinateRunning();
  const isScheduled = await checkSchedule();
  const remainingTime = getCaffeinateRemainingTime();
  const info = loadCaffeinateInfo();

  if (isProcessRunning) {
    let message = "Your Windows PC is currently caffeinated (sleep is prevented)";

    if (remainingTime !== null && remainingTime > 0) {
      message += `. Time remaining: ${formatDuration(remainingTime)}`;
    } else if (info?.watchPid) {
      message += ". Caffeinating while an application is running.";
    } else if (!info?.duration) {
      message += ". Running indefinitely until manually stopped.";
    }

    return message;
  } else if (isScheduled) {
    return "Your Windows PC is caffeinated due to a scheduled caffeination";
  } else {
    return "Your Windows PC is not caffeinated (normal sleep settings apply)";
  }
}
