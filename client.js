var dgram = require("dgram");
var publicIp = require("public-ip");

var server_ip = process.argv[2];
var server_port = process.argv[3];
var chat_name = process.argv[4];

const PYTHON_PORT = isNaN(parseInt(process.argv[5])) ? null : parseInt(process.argv[5]);

var client = dgram.createSocket("udp4");

var peers = [];
var unconnected_peers = [];

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

const holePunch = (count) => {
  if (count === undefined) {
    count = 10;
  }

  if (unconnected_peers.length > 0) {
    unconnected_peers.forEach(peer => {
      console.log(`Attempting holepunch: Address ${peer.address} Port: ${peer.port}`);
      client.send(JSON.stringify({
        type: "holepunch",
        address: public_address,
        port: client.address().port
      }), peer.port, peer.address);
    });

    if (count && count > 0) {
      count--;
      setTimeout(() => {holePunch(count);}, 100);
    }
  }
};

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
      unconnected_peers = message.data;
      holePunch();
      break;
    case "update":
      if (PYTHON_PORT) {
        client.send(JSON.stringify({ type: "message", message: `${message.name} joined chat` }), PYTHON_PORT);
      }
      peers.push(Object.assign({}, message.data, { name: message.name }));
      unconnected_peers.push(Object.assign({}, message.data, { name: message.name }));
      holePunch();
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

client.on("message" , (message) => {
  message = JSON.parse(message);
  if (message.type === "register" || message.type === "deregister" || message.type === "update") {
    //Message from the server
    handleServerMessage(message);
    } else {
    //Message from another client
    if (message.type === "chat") {
      let peer = peers.find(peer => peer.port === message.port && peer.address === message.address);
      message.name = peer.name;
      console.log(`${message.name}: ${message.content}`);
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
      //Received holepunch attempt from another client
      console.log(`Peer holepunched. Address ${message.address} Port: ${message.port}`);
      //Acknowledge holepunch
      let send_message = {
        type: "ack",
        address: public_address,
        port: client.address().port
      };
      client.send(JSON.stringify(send_message), message.port, message.address);
    } else if (message.type === "ack") {
      //Peer acknowledged our holepunch attempt
      console.log(`Peer acknowledged holepunch. Address ${message.address} Port: ${message.port}`);
      //Remove peer from unconnected peers
      unconnected_peers.filter(peer => !(peer.address === message.address && peer.port === message.port));
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

var stdin = process.openStdin();
stdin.addListener("data", function(data) {
    let message = {
      type: "chat",
      content: data.toString().trim(),
      address: public_address,
      port: client.address().port
    };
    peers.forEach(peer => client.send(JSON.stringify(message), peer.port, peer.address));
  });

client.bind();
