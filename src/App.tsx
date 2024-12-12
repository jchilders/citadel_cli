import { Citadel } from './components/Citadel';
import { commands } from '../command_examples/basic-commands';
// import { commands } from '../command_examples/devops-commands';
// import { commands } from '../command_examples/customer-service-commands';

export const config = {
  includeHelpCommand: true, // default true
  resetStateOnHide: true, // default true
  showCitadelKey: '.', // default
};

function App() {
  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-gray-700">
          Press <code className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">.</code>
        </p>
        <Citadel config={config} commands={commands} />
      </div>
    </div>
  );
}

export default App;
