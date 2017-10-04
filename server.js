var dgram = require('dgram');

var server = dgram.createSocket("udp4");

var clients = [];

server.on("listening", () => {
  const address = server.address();
  console.log(`Listening at ${address.address}:${address.port}`);
})

server.bind(9000, "localhost");

server.on('message', (msg, rinfo) => {
  console.log(`Peer ${rinfo.address}:${rinfo.port} registered`);
  clients.forEach(client => {
    let message = {
      data: rinfo,
      type: "update"
    }
    server.send(JSON.stringify(message), client.port, client.address)
  })

  let message = {
      data: clients,
      type: "register"
  }
  server.send(JSON.stringify(message), rinfo.port, rinfo.address)
  clients.push(rinfo);
});
