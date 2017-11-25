import socket
import pickle
import threading
import json
from Naked.toolshed.shell import execute_js

UDP_IP = "127.0.0.1"
# connect to the unix local socket with a stream type
socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
socket.bind((UDP_IP, 0))
ip, UDP_PORT = socket.getsockname()

def startNodeClient(server_ip, server_port, chat_name):
    #Start the node client for network communications
    execute_js('client.js {0} {1} {2} {3}'.format(server_ip, server_port, chat_name, UDP_PORT))

def send(msg, port):
    # Send message to node client so that it can send to other clients
    message = {
        "type": "local",
        "content": msg
    }
    socket.sendto(json.dumps(message).encode(), (UDP_IP, port))
