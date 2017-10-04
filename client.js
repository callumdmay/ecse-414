var prompt = require('prompt');
var dgram = require('dgram');

var server_ip = process.argv[2];
var server_port = process.argv[3];
var chat_name = process.argv[4];

var client = dgram.createSocket("udp4");

var peers = [];

client.on("listening", () => {
  console.log("Connecting...");
  if (server_ip && server_port) {
    let msg = JSON.stringify({type: "register", name: chat_name})
    client.send(msg, server_port, server_ip)
  } else {
    console.log("Bad IP/port");
    socket.close();
  }
})

client.on("message" , (msg, rinfo) => {
  message = JSON.parse(msg);
  if (rinfo.address === server_ip && rinfo.port === parseInt(server_port)) {
    switch(message.type) {
      case "register":
        console.log("Connected to chat!");
        console.log("************************");
        peers = message.data;
        break;
      case "update":
        console.log(`${message.name} joined chat`);
        peers.push(Object.assign({}, message.data, { name: message.name }))
        break;
      case "remove":
        leaving_peer = peers.find(peer => {
          return peer.port === message.data.port && peer.address === message.data.address
        })
        peers = peers.filter(peer => !(peer.port === message.data.port && peer.address === message.data.address));
        console.log(`${leaving_peer.name} has left chat`);
        break;
    }
  } else {
    if (message.type === "chat") {
      console.log(`${message.name}: `, message.content);
    }
  }
})

process.on("SIGINT", () => {
  let msg = JSON.stringify({type: "deregister"});
  client.send(msg, server_port, server_ip, () => {
    client.close();
    process.exit();
  });
});

var stdin = process.openStdin();

stdin.addListener("data", function(data) {
    let message = {
      type: "chat",
      name: chat_name,
      content: data.toString().trim()
    }
    peers.forEach(peer => client.send(JSON.stringify(message), peer.port, peer.address))
  });
client.bind()
