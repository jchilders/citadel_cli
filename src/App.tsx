import { useMemo } from "react";
import { Citadel } from "./index";
import { createBasicCommandRegistry } from "./examples/basicCommands";
import "./styles/app.css";

function App() {
  const commandRegistry = useMemo(() => createBasicCommandRegistry(), []);

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-8">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-xl font-semibold text-gray-800 text-center mb-4">
          Citadel Demo
        </h1>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-700">
          <p className="mb-4">
            Press <code className="px-2 border border-gray-300 rounded">.</code> to activate Citadel.
          </p>
          <p className="text-sm text-gray-500">Press Escape to hide.</p>
        </div>
        <Citadel commandRegistry={commandRegistry} />
      </div>
    </div>
  );
}

export default App;
