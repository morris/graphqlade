set -ex

bash scripts/build.sh
bash scripts/build-examples.sh

ts-node examples/server/src/start.ts
