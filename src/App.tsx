import { Citadel, CitadelConfig, CommandRegistry, TextCommandResult } from "./components/Citadel";

import styles from './App.module.css';

const config: CitadelConfig = {
//   commandTimeoutMs: 10000,
  includeHelpCommand: true, // Default is true
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
    <div className={styles.container}>
      <div className={styles.card}>
        <p className={styles.text}>
          Press <code className={styles.keyCode}>.</code> to<br />activate Citadel
        </p>
        <Citadel commandRegistry={cmdRegistry} config={config} />
      </div>
    </div>
  );
}

export default App;
