import { Citadel } from './components/Citadel';

function App() {
  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-gray-700">
          Press <code className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">.</code>
        </p>
        <Citadel />
      </div>
    </div>
  );
}

export default App;
