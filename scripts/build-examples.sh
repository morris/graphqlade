set -ex

# server
node examples/server/gql2ts.mjs
cp dist/*.umd.* examples/server/public/graphql

# client
npm install --prefix examples/client
node examples/client/gql2ts.static.mjs
tsc --project examples/client/tsconfig.json --incremental --tsBuildInfoFile build/examples.client.tsbuildinfo
cp dist/*.umd.* examples/client/public
