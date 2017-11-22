var dgram = require("dgram");
var ip = require("ip");

var server = dgram.createSocket("udp4");

var server_port = process.argv[2];
var clients = [];

server.on("listening", () => {
  const address = server.address();
  console.log(`Listening at ${address.address}:${address.port}`);
});

if (server_port) {
  server.bind(server_port, ip.address());
} else {
  server.bind(3000, ip.address());
}

const registerNewUser = (msg, rinfo)=> {
  let new_client = Object.assign({}, rinfo, { name: msg.name }, { address: msg.address }, { port: msg.port });
  console.log(`Peer ${new_client.address}:${new_client.port} registered`);
  clients.forEach(client => {
    let message = {
      data: new_client,
      type: "update",
      name: msg.name
    };
    server.send(JSON.stringify(message), client.port, client.address);
  });

  let message = {
      data: clients,
      type: "register"
  };
  server.send(JSON.stringify(message), new_client.port, new_client.address);
  clients.push(new_client);
};

const deregisterNewUser = (msg, rinfo) => {
  console.log(`Peer ${msg.address}:${msg.port} deregistered`);
  clients = clients.filter(client => !(client.port === msg.port && client.address === msg.address));
  let deregistered_client = Object.assign({}, rinfo, { address: msg.address }, { port: msg.port });
  clients.forEach(client => {
    let message = {
      data: deregistered_client,
      type: "remove",
    };
    server.send(JSON.stringify(message), client.port, client.address);
  });
};

server.on("message", (msg, rinfo) => {
  msg = JSON.parse(msg);
  switch (msg.type) {
    case "register":
      registerNewUser(msg, rinfo);
      break;
    case "deregister":
      deregisterNewUser(msg, rinfo);
      break;
  }
  console.log(`Current number of clients: ${clients.length}`);

});
