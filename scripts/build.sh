set -ex

# dist
tsc --project tsconfig.build.json --incremental --tsBuildInfoFile build/dist.tsbuildinfo

# browser
tsc --project tsconfig.browser.json --incremental --tsBuildInfoFile build/browser.tsbuildinfo
cat build/graphqlade.amd.js | node scripts/amd2umd.js graphqlade/dist/browser graphqlade | prettier --parser babel > dist/graphqlade.umd.js
cat dist/graphqlade.umd.js | terser --compress --mangle -o dist/graphqlade.umd.min.js
