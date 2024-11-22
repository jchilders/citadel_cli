import { CommandItem } from '../types';

interface AvailableCommandsProps {
  available: CommandItem[];
  currentArg: any;
}

export const AvailableCommands: React.FC<AvailableCommandsProps> = ({
  available,
  currentArg
}) => {
  if (currentArg || available.length === 0) return null;

  return (
    <div className="mt-2 border-t border-gray-700 pt-2">
      <div className="flex flex-wrap gap-2">
        {available.map((cmd) => {
          const boldLength = available.reduce((length, other) => {
            if (other.name === cmd.name) return length;
            let commonPrefix = 0;
            while (
              commonPrefix < cmd.name.length &&
              commonPrefix < other.name.length &&
              cmd.name[commonPrefix].toLowerCase() === other.name[commonPrefix].toLowerCase()
            ) {
              commonPrefix++;
            }
            return Math.max(length, commonPrefix + 1);
          }, 1);

          return (
            <div
              key={cmd.name}
              className="px-2 py-1 rounded bg-gray-800"
            >
              <span className="font-mono text-white">
                <strong className="underline">{cmd.name.slice(0, boldLength)}</strong>
                {cmd.name.slice(boldLength)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};