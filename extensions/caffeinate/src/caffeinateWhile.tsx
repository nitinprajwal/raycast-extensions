import { Action, ActionPanel, Form, popToRoot, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { startCaffeinate, getRunningProcesses, isCaffeinateRunning, stopCaffeinate } from "./utils";

interface Process {
  name: string;
  pid: number;
}

export default function Command() {
  const [loading, setLoading] = useState(true);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [alreadyCaffeinated, setAlreadyCaffeinated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Check if already caffeinated
        setAlreadyCaffeinated(isCaffeinateRunning());

        const procs = await getRunningProcesses();
        // Sort processes alphabetically by name
        procs.sort((a, b) => a.name.localeCompare(b.name));
        setProcesses(procs);
      } catch (error) {
        console.error("Failed to get running processes:", error);
        await showToast(Toast.Style.Failure, "Failed to get running applications");
      }
      setLoading(false);
    })();
  }, []);

  return (
    <Form
      isLoading={loading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Caffeinate"
            onSubmit={async (data) => {
              const pid = Number(data.process);
              const selectedProcess = processes.find((p) => p.pid === pid);

              if (!selectedProcess) {
                await showToast(Toast.Style.Failure, "Please select an application");
                return;
              }

              // If already caffeinated, stop first
              if (alreadyCaffeinated) {
                await stopCaffeinate({ status: false });
              }

              await startCaffeinate({ status: true }, `☕ Caffeinating while ${selectedProcess.name} is running`, {
                watchPid: pid,
              });
              popToRoot();
            }}
          />
        </ActionPanel>
      }
    >
      {alreadyCaffeinated && (
        <Form.Description
          title="⚠️ Note"
          text="Caffeine is already active. Selecting an app will replace the current caffeination."
        />
      )}
      <Form.Dropdown id="process" title="Application">
        {processes.map((process) => (
          <Form.Dropdown.Item key={process.pid} value={String(process.pid)} title={process.name} />
        ))}
      </Form.Dropdown>
      {processes.length === 0 && !loading && (
        <Form.Description title="No Applications" text="No applications with visible windows were found." />
      )}
    </Form>
  );
}
