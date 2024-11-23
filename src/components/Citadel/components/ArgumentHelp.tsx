import { CommandArg } from '../types/command'

interface ArgumentHelpProps {
  currentArg: CommandArg | null;
}

export const ArgumentHelp: React.FC<ArgumentHelpProps> = ({ currentArg }) => {
  if (!currentArg) return null;

  return (
    <div className="text-sm text-gray-400 ml-6 mb-2">
      {currentArg.description}
    </div>
  );
};