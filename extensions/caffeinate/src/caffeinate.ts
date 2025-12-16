import { startCaffeinate, getSchedule, changeScheduleState, isCaffeinateRunning } from "./utils";
import { showHUD } from "@raycast/api";

export default async () => {
  // Check if already caffeinated
  if (isCaffeinateRunning()) {
    await showHUD("☕ Your Windows PC is already caffeinated!");
    return;
  }

  const schedule = await getSchedule();
  if (schedule != undefined) await changeScheduleState("decaffeinate", schedule);
  await startCaffeinate({ status: true }, "☕ Your Windows PC is now caffeinated");
};
