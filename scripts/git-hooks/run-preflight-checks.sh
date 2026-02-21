#!/bin/sh

echo "Running tests before push..."
npm test

if [ $? -ne 0 ]; then
  echo "Tests failed. Aborting."
  exit 1
fi

npm run build
if [ $? -ne 0 ]; then
  echo "Build failed. Aborting."
  exit 1
fi

echo "Checks passed."
exit 0
