var dgram = require('dgram');

var server_ip = process.argv[2];
var server_port = process.argv[3];
var chat_name = process.argv[4];
const PYTHON_PORT = isNaN(parseInt(process.argv[5])) ? null : parseInt(process.argv[5]);


var client = dgram.createSocket("udp4");

var peers = [];

client.on("listening", () => {
  console.log("Connecting...");
  if (server_ip && server_port) {
    let msg = JSON.stringify({type: "register", name: chat_name})
    client.send(msg, server_port, server_ip)
  } else {
    console.log("Bad IP/port");
    client.close();
    process.exit();
  }
})

client.on("message" , (msg, rinfo) => {
  let message = JSON.parse(msg);

  //Message from the server
  if (rinfo.address === server_ip && rinfo.port === parseInt(server_port)) {
    switch(message.type) {
      case "register":
      console.log("Connected to server")
        if (PYTHON_PORT) {
          client.send(JSON.stringify({type: "connect", port: client.address().port}), PYTHON_PORT);
        }
        peers = message.data;
        peers.forEach(peer => client.send(JSON.stringify({
          type: "holepunch"
        }), peer.port, peer.address))
        break;
      case "update":
        if (PYTHON_PORT) {
          client.send(JSON.stringify({type: "message", message: `${message.name} joined chat`}), PYTHON_PORT);
        }
        peers.push(Object.assign({}, message.data, { name: message.name }))
        let send_message = {
        }
        client.send(JSON.stringify({
          type: "holepunch"
        }), message.data.port, message.data.address)
        break;
      case "remove":
        leaving_peer = peers.find(peer => {
          return peer.port === message.data.port && peer.address === message.data.address
        })
        peers = peers.filter(peer => !(peer.port === message.data.port && peer.address === message.data.address));

        if (leaving_peer) {
          if (PYTHON_PORT) {
            client.send(JSON.stringify({type: "message", message: `${leaving_peer.name} has left chat`}), PYTHON_PORT);
          }
        }
        break;
    }
  } else {
    //Message from another client
    if (message.type === "chat") {
      let peer = peers.find(peer => peer.port === rinfo.port && peer.address === rinfo.address)
      message.name = peer.name;
      if (PYTHON_PORT) {
        client.send(JSON.stringify(message), PYTHON_PORT);
      }
    } else if (message.type === "local") {
      let send_message = {
        type: "chat",
        content: message.content
      }
      peers.forEach(peer => client.send(JSON.stringify(send_message), peer.port, peer.address))
    } else if (message.type === "holepunch") {
      console.log(`Peer holepunched. Address ${rinfo.address} Port: ${rinfo.port}`);
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
      content: data.toString().trim()
    }
    peers.forEach(peer => client.send(JSON.stringify(message), peer.port, peer.address))
  });


client.bind();
