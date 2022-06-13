set -e

npm install
npm run clean
npm run lint
npm run format-check
npm run build
npm run build-examples
npm test
