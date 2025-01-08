Ok. We need to rework user input flow. Let's go through this again:

1. User hits `.` to bring up Citadel
2. They are presented with a `⟩` prompt and a list of commands below it; this
   list corresponds to the top level entries from the CommandConfig.
3. The user can navigate the commands in any of the following ways:
  - By typing the first letter(s) of the command.
  - By hitting tab to cycle through the commands
  - Using arrow keys to navigate the list
4. As they navigate the commands the prompt is updated with the command name
4. The user hits Enter to actually select the command
  - If the command has no subcommands and requires no arguments then it is
    executed.
  - If it has subcommands then they are presented to the user in the same way
    as the top level commands.
  - If the command requires arguments the user is prompted for them. The prompt should
    indicate what is being asked for (e.g.: "userId", "reportId").

After command execution any command output is displayed. It is expected that a
JSON list of key/value pairs will be returned. Display this, with the key
bolded. The command line is then cleared and we go back to step (2) above.

Backspace behavior: During command navigation/selection the user can hit the
backspace key to erase previous selections. The user can hit backspace multiple
times to undo multiple selections. Hitting backspace with nothing selected
(i.e. an empty prompt) does nothing.
