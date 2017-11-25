var dgram = require("dgram");
var ip = require("ip");

var server = dgram.createSocket("udp4");

var server_port = process.argv[2];
var clients = [];

//Set up server to listen on a UDP port
server.on("listening", () => {
  const address = server.address();
  console.log(`Listening at ${address.address}:${address.port}`);
});

//Add new client to server clients list
const registerNewUser = (msg, rinfo)=> {
  let new_client = Object.assign({}, rinfo, { name: msg.name }, { address: msg.address }, { port: msg.port });
  console.log(`Peer ${new_client.address}:${new_client.port} registered`);
  //Alert all other clients about the new client
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
  //Send the new client the current client list
  server.send(JSON.stringify(message), new_client.port, new_client.address);
  clients.push(new_client);
};

//Remove client from client list
const deregisterNewUser = (msg, rinfo) => {
  console.log(`Peer ${msg.address}:${msg.port} deregistered`);
  clients = clients.filter(client => !(client.port === msg.port && client.address === msg.address));
  let deregistered_client = Object.assign({}, rinfo, { address: msg.address }, { port: msg.port });
  //Alert other clients about leaving client
  clients.forEach(client => {
    let message = {
      data: deregistered_client,
      type: "remove",
    };
    server.send(JSON.stringify(message), client.port, client.address);
  });
};

//Callback function whenever the server receives any message
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

if (server_port) {
  server.bind(server_port, ip.address());
} else {
  server.bind(3000, ip.address());
}
