# ECSE 414 Project

## Instructions

**You must have node, pip and pipenv installed**

#### To run the server:
`node server.js [ip] [port]`

#### To start a client:

Create the pipenv shell: `pipenv --three shell`

Then start the pipenv virtual shell if it didn't already start: `pipenv shell`

Install all python dependencies: `pipenv install`

Then run the gui script within the shell: `python gui.py`

---
The client will connect to the server, updating the server with its own IP and port, and the server will send back the IP and port of all peers to connect with. It will also update the other peers with the IP of the new client that is connecting. 

The new client will send a UDP packet to all peers, creating the hole in the NAT. Each of the peers, after receiving the new client info from the server, will send a UDP packet to this new peer, creating the hole in the NAT. The connection is now established between all peers and the newly connected peer.
