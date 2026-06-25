import { CliSession } from './session';
import { renderResult } from './render-result';
import { runRepl } from './repl';
import { demoRegistry } from './demo-registry';

const scriptFlag = process.argv.find((arg) => arg.startsWith('--script='));

if (scriptFlag) {
  // Non-interactive mode for demos/CI: feed a keystroke string (characters are
  // typed; '\n' presses Enter) and print each executed command's output. Proves
  // the engine runs end-to-end under plain Node, no TTY required.
  const keys = scriptFlag.slice('--script='.length);
  const session = new CliSession(demoRegistry(), (executed) => {
    console.log(`[${executed.path.join(' ')}] → ${renderResult(executed.result).replace(/\n/g, ' ')}`);
  });

  (async () => {
    for (const ch of keys) {
      if (ch === '\n') {
        await session.press({ name: 'Enter' });
      } else {
        await session.typeChar(ch);
      }
    }
  })();
} else {
  runRepl(demoRegistry());
}
