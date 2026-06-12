# Citadel Screenshot Sequences

Use these `--tab` + `--keys` combinations with the capture script.

## Basic

- Show a user result:
  - `--tab "Basic"`
  - `--keys "u s 1234 Enter"`

## Spreadsheet

This tab hides Citadel's output pane (`showOutputPane: false`), so command
feedback is the team table itself — omit `--clip-citadel` and capture the
whole page to see the effect.

- Filter the on-page team table by role:
  - `--tab "Spreadsheet"`
  - `--keys "f a Enter"`

- Sort the team table by name, descending:
  - `--tab "Spreadsheet"`
  - `--keys "s n d Enter"`

- Clear the table filter and sort:
  - `--tab "Spreadsheet"`
  - `--keys "r Enter"`

## Local Full-Stack

- Snapshot local stack status:
  - `--tab "Local Full-Stack"`
  - `--keys "s s Enter"`

- List localStorage keys:
  - `--tab "Local Full-Stack"`
  - `--keys "loc l Enter"`

- Set and read one localStorage key (note the `Space` token committing the
  first argument before the second is typed):
  - `--tab "Local Full-Stack"`
  - `--keys "loc s demo.theme Space dark Enter loc g demo.theme Enter"`

## DevOps

- Show metrics:
  - `--tab "DevOps"`
  - `--keys "m m Enter"`

## Runtime Config

- Switch to inline mode:
  - `--tab "Runtime Config"`
  - `--keys "d m i Enter"`

## Helpful Key Tokens

- Submit command: `Enter`
- Pause: `wait:500`
- Close panel: `Escape`
