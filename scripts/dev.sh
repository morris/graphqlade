set -e

sh scripts/build.sh
sh scripts/build-examples.sh

ts-node examples/server/src/server.ts
