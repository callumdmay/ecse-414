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
    let msg = JSON.stringify({type: "register"})
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
        console.log("************************");
        console.log("A new user joined the chat!");
        console.log("************************");
        peers.push(message.data)
        client.send
        break;
    }
  } else {
    if (message.type === "chat") {
      console.log(`${message.name}: `, message.content);
    }
  }
})

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
