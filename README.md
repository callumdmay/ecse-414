# ECSE 414 Project

## Instructions

**You must have node, pip and pipenv installed**

#### To run the server:
`node server.js`

#### To start a client:

Create the pipenv shell: `pipenv --three shell`

Then start the pipenv virtual shell if it didn't already start: `pipenv shell`

Install all python dependencies: `pipenv install`

Then run the gui script within the shell: `python gui.py`

---
The client will connect to the server, updating the server with its own IP and port, and the server will return the IP and port of all peers to begin chat.
