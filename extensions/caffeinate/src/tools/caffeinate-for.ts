import { startCaffeinate, isCaffeinateRunning } from "../utils";

type Input = {
  /**
   * Number of hours (optional). Must be a non-negative integer.
   */
  hours?: number;
  /**
   * Number of minutes (optional). Must be a non-negative integer.
   */
  minutes?: number;
  /**
   * Number of seconds (optional). Must be a non-negative integer.
   */
  seconds?: number;
};

/**
 * Prevents your Windows PC from going to sleep for a specified duration
 */
export default async function (input: Input) {
  const { hours = 0, minutes = 0, seconds = 0 } = input;

  if (hours === 0 && minutes === 0 && seconds === 0) {
    throw new Error("Please specify a duration");
  }

  // Check if already caffeinated
  if (isCaffeinateRunning()) {
    throw new Error("Windows PC is already caffeinated. Please decaffeinate first before setting a new duration.");
  }

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const formattedTime = `${hours ? `${hours}h` : ""}${minutes ? `${minutes}m` : ""}${seconds ? `${seconds}s` : ""}`;

  await startCaffeinate({ status: true }, undefined, { duration: totalSeconds });

  return `Windows PC will stay awake for ${formattedTime}`;
}
