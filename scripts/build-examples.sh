set -e

# server
node examples/server/gql2ts.js

# client
ts-node examples/server/src/server.ts &
sleep 10
node examples/client/gql2ts.js
tsc --project examples/client/tsconfig.json
cp dist/*.umd.* examples/client/public
kill %1
