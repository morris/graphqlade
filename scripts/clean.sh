set -ex

rm -rf build coverage dist

rm -rf examples/client/public/*.js
rm -rf examples/client/public/*.js.map
rm -rf examples/client/node_modules
rm -rf examples/client/package-lock.json

rm -rf examples/react/node_modules
rm -rf examples/react/package-lock.json
