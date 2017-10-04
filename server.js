var dgram = require('dgram');

var server = dgram.createSocket("udp4");

var clients = [];

server.on("listening", () => {
  const address = server.address();
  console.log(`Listening at ${address.address}:${address.port}`);
})

server.bind(9000, "localhost");

const registerNewUser = (msg, rinfo)=> {
  console.log(`Peer ${rinfo.address}:${rinfo.port} registered`);
  clients.forEach(client => {
    let message = {
      data: rinfo,
      type: "update",
      name: msg.name
    }
    server.send(JSON.stringify(message), client.port, client.address)
  })

  let message = {
      data: clients,
      type: "register"
  }
  server.send(JSON.stringify(message), rinfo.port, rinfo.address)
  clients.push(Object.assign({}, rinfo, { name: msg.name }));
}

const deregisterNewUser = (msg, rinfo) => {
  console.log(`Peer ${rinfo.address}:${rinfo.port} deregistered`);
  clients = clients.filter(client => !(client.port === rinfo.port && client.address === rinfo.address))
  clients.forEach(client => {
    let message = {
      data: rinfo,
      type: "remove",
    }
    server.send(JSON.stringify(message), client.port, client.address)
  });
}


server.on('message', (msg, rinfo) => {
  msg = JSON.parse(msg);
  switch(msg.type) {
    case "register":
      registerNewUser(msg, rinfo);
      break;
    case "deregister":
      deregisterNewUser(msg, rinfo);
      break;
  }
  console.log(`Current number of client: ${clients.length}`);

});
