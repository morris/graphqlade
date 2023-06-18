set -ex

# pack
npm pack
mv graphqlade-$(node -p "require('./package.json').version").tgz graphqlade.tgz

# server
node examples/server/gql2ts.mjs

# client
npm install --prefix examples/client
node examples/client/gql2ts.static.mjs
tsc --project examples/client/tsconfig.json --incremental --tsBuildInfoFile build/examples.client.tsbuildinfo
cp dist/*.umd.* examples/client/public

# react
npm install --prefix examples/react
