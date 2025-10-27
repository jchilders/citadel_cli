import { useMemo, useState } from "react";
import { Citadel } from "./index";
import { createBasicCommandRegistry } from "./examples/basicCommands";
import "./styles/app.css";

// Minimal showcase for citadel_cli
function App() {
  const commandRegistry = useMemo(() => createBasicCommandRegistry(), []);
  const [mode, setMode] = useState<"panel" | "inline">("panel");
  const [includeHelpCommand, setIncludeHelpCommand] = useState(true);
  const ModeToggle = () => (
    <div className="flex justify-center mb-6">
      <div className="inline-flex rounded-full border border-gray-300 bg-gray-100 p-1 text-sm font-medium">
        <button
          type="button"
          className={`px-4 py-2 rounded-full transition ${
            mode === "panel"
              ? "bg-white shadow text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setMode("panel")}
          data-testid="mode-toggle-panel"
        >
          Panel
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-full transition ${
            mode === "inline"
              ? "bg-white shadow text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setMode("inline")}
          data-testid="mode-toggle-inline"
        >
          Inline
        </button>
      </div>
    </div>
  );

  const ToggleHelpButton = () => (
    <button
      type="button"
      className="mt-4 px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
      onClick={() => setIncludeHelpCommand((prev) => !prev)}
      data-testid="toggle-help-command"
    >
      {includeHelpCommand ? 'Disable help command' : 'Enable help command'}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-8">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6">
        <ModeToggle />
        <div className="flex justify-center">
          <ToggleHelpButton />
        </div>
        <h1 className="text-xl font-semibold text-gray-800 text-center mb-4">
          Citadel Demo
        </h1>
        {mode === "inline" ? (
          <>
            <div
              className="h-[420px] border border-gray-200 rounded relative overflow-hidden bg-gray-900"
              data-testid="citadel-inline-demo"
            >
              <Citadel
                config={{ displayMode: "inline", includeHelpCommand }}
                commandRegistry={commandRegistry}
              />
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-700">
              <p className="mb-4">
                Press <code className="px-2 border border-gray-300 rounded">.</code> to activate Citadel.
              </p>
              <p className="text-sm text-gray-500">Press Escape to hide.</p>
            </div>
            <Citadel
              commandRegistry={commandRegistry}
              config={{ includeHelpCommand }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
