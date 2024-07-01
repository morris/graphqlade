set -e

node $1.mjs &
pid=$!
sleep 1
echo "### $1"
echo ''
echo '```'
autocannon -c 10 -d 20 -p 1 http://localhost:3000/graphql?query={hello}
echo '```'
echo ''
kill $pid
