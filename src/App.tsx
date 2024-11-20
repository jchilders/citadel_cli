import { Citadel } from './components/command-pallete/Citadel';
import type { CommandConfig } from './components/command-pallete/types';
import { defaultCommandConfig } from './components/command-pallete/config';

const customCommands: CommandConfig = {
  ...defaultCommandConfig,
  // Add any custom commands here
};
function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <h1 className="text-2xl p-4">Your App Content</h1>
      
      {/* Use default commands */}
      {/* <Citadel /> */}
      
      {/* Or use custom commands */}
      <Citadel commands={customCommands} />
    </div>
  );
}

export default App;
