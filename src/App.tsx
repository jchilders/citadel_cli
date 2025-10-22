import { Citadel } from "./index";
import { createBasicCommandRegistry } from "./examples/basicCommands";

// import { CitadelConfig } from './components/Citadel/config/types';
// export const config: CitadelConfig = {
//   commandTimeoutMs: 10000,
//   includeHelpCommand: true,
//   resetStateOnHide: true,
//   showCitadelKey: '.',
//   maxHeight: '80vh'
// };

// Seed the demo app with the shared basic command registry
const cmdRegistry = createBasicCommandRegistry();

import "./styles/app.css"

function App() {
  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-center text-gray-700">
          Press <code className="px-2 border border-gray-300 rounded">.</code> to<br />activate Citadel
        </p>
        <Citadel commandRegistry={cmdRegistry} />
      </div>
    </div>
  );
}

export default App;
