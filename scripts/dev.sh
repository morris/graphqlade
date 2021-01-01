set -e

concurrently \
  "tsc --watch --preserveWatchOutput" \
  "tsc --project tsconfig.browser.json --watch --preserveWatchOutput" \
  "node examples/server/gql2ts.js --watch" \
  "nodemon --watch 'examples/server/**/*' --exec ts-node examples/server/src/server.ts" \
  "tsc --project examples/client/tsconfig.json --watch --preserveWatchOutput" \
  "nodemon --watch 'dist/*.umd.*' --exec 'cp dist/*.umd.* examples/client/public'" \
  "sleep 10 && node examples/client/gql2ts.js --watch"

