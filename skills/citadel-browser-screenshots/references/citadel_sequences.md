# Citadel Screenshot Sequences

Use these `--tab` + `--keys` combinations with the capture script.

## Basic

- Show a user result:
  - `--tab "Basic"`
  - `--keys "u s 1234 Enter"`

## Page Control

- Filter the on-page team table by role:
  - `--tab "Page Control"`
  - `--keys "u f a Enter"`

- Sort the team table by name:
  - `--tab "Page Control"`
  - `--keys "u s n Enter"`

- Flip the demo page to the light theme:
  - `--tab "Page Control"`
  - `--keys "t l Enter"`

- Pop a toast notification:
  - `--tab "Page Control"`
  - `--keys "n \"Build finished\" Enter"`

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
