var dgram = require("dgram");
var publicIp = require("public-ip");

var server_ip = process.argv[2];
var server_port = process.argv[3];
var chat_name = process.argv[4];

const PYTHON_PORT = isNaN(parseInt(process.argv[5])) ? null : parseInt(process.argv[5]);

var client = dgram.createSocket("udp4");

var peers = [];

var public_address = null;

//Called when UDP client socket is ready
client.on("listening", () => {
  console.log("Connecting...");
  if (server_ip && server_port) {
    //Use node package to get public ip
    publicIp.v4().then(address => {
      public_address = address;
      let msg = JSON.stringify({
        type: "register",
        name: chat_name,
        address: address,
        port: client.address().port
      });
    client.send(msg, server_port, server_ip);
    });
  } else {
    console.log("Bad IP/port");
    client.close();
    process.exit();
  }
});

const handleServerMessage = (message) => {
  switch (message.type) {
    case "register":
    console.log("Connected to server");
      if (PYTHON_PORT) {
        //Tell python GUI which port to send and receive messages from
        client.send(JSON.stringify({ type: "connect", port: client.address().port }), PYTHON_PORT);
      }
      console.log("Client info from server:\n", message);
      peers = message.data;
      peers.forEach(peer => {
        console.log(`Attempting holepunch: Address ${peer.address} Port: ${peer.port}`);
        client.send(JSON.stringify({
          type: "holepunch",
          address: public_address,
          port: client.address().port
        }), peer.port, peer.address);
      });
      break;
    case "update":
      if (PYTHON_PORT) {
        client.send(JSON.stringify({ type: "message", message: `${message.name} joined chat` }), PYTHON_PORT);
      }
      peers.push(Object.assign({}, message.data, { name: message.name }));
      console.log(`New peer. Attempting holepunch: Address ${message.data.address} Port: ${message.data.port}`);
      client.send(JSON.stringify({
        type: "holepunch",
        address: public_address,
        port: client.address().port
      }), message.data.port, message.data.address);
      break;
    case "remove": {
      let leaving_peer = peers.find(peer => {
        return peer.port === message.data.port && peer.address === message.data.address;
      });
      peers = peers.filter(peer => !(peer.port === message.data.port && peer.address === message.data.address));

      if (leaving_peer) {
        if (PYTHON_PORT) {
          client.send(JSON.stringify({ type: "message", message: `${leaving_peer.name} has left chat` }), PYTHON_PORT);
        }
      }
      break;
    }
  }
};

client.on("message" , (message, rinfo) => {
  message = JSON.parse(message);
  if (rinfo.address === server_ip && rinfo.port === parseInt(server_port)) {
    //Message from the server
    handleServerMessage(message);
    } else {
    if (message.type === "chat") {
      //Message from another client
      let peer = peers.find(peer => peer.port === message.port && peer.address === message.address);
      message.name = peer.name;
      //Send client message to Python GUI
      if (PYTHON_PORT) {
        client.send(JSON.stringify(message), PYTHON_PORT);
      }
    } else if (message.type === "local") {
      //message from Python GUI
      let send_message = {
        type: "chat",
        content: message.content,
        address: public_address,
        port: client.address().port
      };
      //Send chat message we received from Python GUI to all clients we know of
      peers.forEach(peer => client.send(JSON.stringify(send_message), peer.port, peer.address));
    } else if (message.type === "holepunch") {
      //Received holepunch from another client
      console.log(`Peer holepunched. Address ${message.address} Port: ${message.port}`);
    }
  }
});

process.on("SIGINT", () => {
  let msg = JSON.stringify({
    type: "deregister",
    address: public_address,
    port: client.address().port
  });
  client.send(msg, server_port, server_ip, () => {
    client.close();
    process.exit();
  });
});

client.bind();
