import http from 'http';
import fs from "fs";
const { PORT = '3000' } = process.env;

const requestHandler = (request, response) => {
  response.end(fs.readFileSync('permissions.json', 'utf8'));
}

const server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log(`server is listening on ${PORT}`)
});
