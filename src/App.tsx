import { Citadel, CitadelConfig, CommandRegistry, TextCommandResult } from ".";

import "./styles/app.css"

export const config: CitadelConfig = {
//   commandTimeoutMs: 10000,
  includeHelpCommand: false,
//   resetStateOnHide: true,
//   showCitadelKey: '.',
//   maxHeight: '80vh'
};

// 1. Create the registry where commands will be stored
const cmdRegistry = new CommandRegistry();

// 2. Add a command to the registry. This can be called as many times as you like.
cmdRegistry.addCommand(
  [
    { type: 'word', name: 'greet' },
    { type: 'argument', name: 'name', description: 'Enter your name' }
  ],
  'Say hello to the world', // The description of this command. Used by "help".

  // The final parameter is the "handler", which is what will get called when the user hits enter.
  // The return type for this handler is `TextCommandResult`. There are other
  // types of command result that we'll cover later.
  async (args: string[]) => new TextCommandResult(`Hello, ${args[0]}!`) 
);

function App() {
  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-center text-gray-700">
          Press <code className="px-2 border border-gray-300 rounded">.</code> to<br />activate Citadel
        </p>
        <Citadel commandRegistry={cmdRegistry} config={config} />
      </div>
    </div>
  );
}

export default App;
