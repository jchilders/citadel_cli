import { Citadel } from './components/command-pallete/Citadel';
import type { CommandConfig } from './components/command-pallete/types';
import { defaultCommandConfig } from './components/command-pallete/commands-config';

const customCommands: CommandConfig = {
  ...defaultCommandConfig,
  // Add any custom commands here
};
function App() {
  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-gray-700">
          Press <code className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">.</code>
        </p>
        <Citadel commands={customCommands} />
      </div>
    </div>
  );
}

export default App;
