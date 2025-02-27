import { CitadelCli } from '../CitadelCli';

declare global {
  interface HTMLElementTagNameMap {
    'citadel-cli': CitadelCli;
  }

  namespace JSX {
    interface IntrinsicElements {
      'citadel-cli': JSX.IntrinsicElements['div'] & {
        ref?: React.RefObject<CitadelCli>;
      };
    }
  }
}
