import { stopCaffeinate, getSchedule, isCaffeinateRunning } from "./utils";
import { showToast, Toast, showHUD } from "@raycast/api";

export default async () => {
  // Check if not caffeinated
  if (!isCaffeinateRunning()) {
    await showHUD("💤 Your Windows PC is already decaffeinated");
    return;
  }

  const schedule = await getSchedule();
  if (schedule != undefined && schedule.IsRunning == true)
    await showToast(Toast.Style.Failure, "Caffeination schedule running, pause to decaffeinate");
  else await stopCaffeinate({ status: true }, "💤 Your Windows PC is now decaffeinated");
};
