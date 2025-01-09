import React from 'react';
import { render, act } from '@testing-library/react';
import { CitadelConfigProvider, useCitadelCommands } from '../CitadelConfigContext';
import { JsonCommandResult } from '../../types/command-results';

describe('CitadelConfigContext', () => {
  describe('command flattening', () => {
    const TestComponent = () => {
      const commands = useCitadelCommands();
      return <div data-testid="commands">{JSON.stringify(commands)}</div>;
    };

    it('should flatten hierarchical commands correctly', () => {
      const hierarchicalCommands = {
        user: {
          description: 'User management commands',
          deactivate: {
            description: 'Deactivate user account',
            handler: async (args: string[]) => new JsonCommandResult({
              id: args[0],
              status: "deactivated"
            }),
            argument: { name: 'userId', description: 'Enter user ID' }
          },
          query: {
            firstname: {
              description: 'Search by first name',
              handler: async (args: string[]) => new JsonCommandResult({
                users: [
                  { id: 1, name: `${args[0]} Smith` },
                  { id: 2, name: `${args[0]} Jones` }
                ]
              }),
              argument: { name: 'firstName', description: 'Enter first name' }
            }
          }
        }
      };

      const { getByTestId } = render(
        <CitadelConfigProvider commands={hierarchicalCommands}>
          <TestComponent />
        </CitadelConfigProvider>
      );

      const commandsElement = getByTestId('commands');
      const flattenedCommands = JSON.parse(commandsElement.textContent || '{}');

      // Verify flattened structure
      expect(flattenedCommands).toHaveProperty('user.deactivate');
      expect(flattenedCommands).toHaveProperty('user.query.firstname');

      // Verify command properties are preserved
      expect(flattenedCommands['user.deactivate']).toEqual({
        description: 'Deactivate user account',
        handler: expect.any(Function),
        argument: { name: 'userId', description: 'Enter user ID' }
      });

      expect(flattenedCommands['user.query.firstname']).toEqual({
        description: 'Search by first name',
        handler: expect.any(Function),
        argument: { name: 'firstName', description: 'Enter first name' }
      });
    });

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

    it('should preserve handler functionality after flattening', async () => {
      const mockHandler = jest.fn().mockResolvedValue(new JsonCommandResult({ success: true }));
      
      const hierarchicalCommands = {
        test: {
          command: {
            description: 'Test command',
            handler: mockHandler,
            argument: { name: 'testArg', description: 'Test argument' }
          }
        }
      };

      const { getByTestId } = render(
        <CitadelConfigProvider commands={hierarchicalCommands}>
          <TestComponent />
        </CitadelConfigProvider>
      );

      const commandsElement = getByTestId('commands');
      const flattenedCommands = JSON.parse(commandsElement.textContent || '{}');
      
      // Execute the flattened command's handler
      await act(async () => {
        await flattenedCommands['test.command'].handler(['test-arg']);
      });

      expect(mockHandler).toHaveBeenCalledWith(['test-arg']);
    });
  });
});
