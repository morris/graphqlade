set -e

npm install

bash benchmark1.sh graphqlade-http
bash benchmark1.sh graphqlade-express
bash benchmark1.sh graphql-yoga
