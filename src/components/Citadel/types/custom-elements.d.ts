import { CitadelElement } from '../CitadelElement';

declare global {
  interface HTMLElementTagNameMap {
    'citadel-element': CitadelElement;
  }

  namespace JSX {
    interface IntrinsicElements {
      'citadel-element': JSX.IntrinsicElements['div'] & {
        ref?: React.RefObject<CitadelElement>;
      };
    }
  }
}
