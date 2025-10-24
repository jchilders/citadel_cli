import { Citadel } from "./index";
import "./styles/app.css";

function App() {
  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-8">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-xl font-semibold text-gray-800 text-center mb-4">
          Citadel Inline Demo
        </h1>
        <div
          className="h-[420px] border border-gray-200 rounded relative overflow-hidden bg-gray-900"
          data-testid="citadel-inline-demo"
        >
          <Citadel config={{ displayMode: 'inline' }} />
        </div>
      </div>
    </div>
  );
}

export default App;
