import { render } from '@testing-library/react';
import { CitadelConfigProvider, useCitadelCommands } from '../CitadelConfigContext';

describe('CitadelConfigContext', () => {
  describe('command flattening', () => {
    const TestComponent = () => {
      const commands = useCitadelCommands();
      return <div data-testid="commands">{JSON.stringify(commands)}</div>;
    };

    it('should handle empty commands object', () => {
      const { getByTestId } = render(
        <CitadelConfigProvider commands={{}}>
          <TestComponent />
        </CitadelConfigProvider>
      );

      const commandsElement = getByTestId('commands');
      const flattenedCommands = JSON.parse(commandsElement.textContent || '{}');
      expect(Object.keys(flattenedCommands)).toHaveLength(0);
    });

    it('should handle undefined commands', () => {
      const { getByTestId } = render(
        <CitadelConfigProvider>
          <TestComponent />
        </CitadelConfigProvider>
      );

      const commandsElement = getByTestId('commands');
      expect(commandsElement.textContent).toBe('');
    });
  });
});
