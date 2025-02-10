import { Citadel } from './components/Citadel';
import { CitadelConfig } from './components/Citadel/config/types';

import { registerBasicCommands } from '../command_examples/basic-commands';
// import { commands } from '../command_examples/devops-commands';
// import { commands } from '../command_examples/customer-service-commands';

export const config: CitadelConfig = {
  // commandTimeoutMs: 10000,
  // includeHelpCommand: true,
  // resetStateOnHide: true,
  // showCitadelKey: '.',
  // maxHeight: '80vh'
};


import "./styles/app.css"

function App() {
  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-center text-gray-700">
          Press <code className="px-2 border border-gray-300 rounded">.</code> to<br />activate Citadel
        </p>
        <Citadel config={config} commandRegistry={registerBasicCommands()}/>
      </div>
    </div>
  );
}

export default App;
