import { startCaffeinate, stopCaffeinate, isCaffeinateRunning } from "./utils";

export default async () => {
  if (isCaffeinateRunning()) {
    await stopCaffeinate({ status: true }, "💤 Your Windows PC is now decaffeinated");
  } else {
    await startCaffeinate({ status: true }, "☕ Your Windows PC is now caffeinated");
  }
};
