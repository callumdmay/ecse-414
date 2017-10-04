import socket
import threading
from peerconnection import BTPeerConnection

s = socket.socket( socket.AF_INET, socket.SOCK_STREAM )
host = "localhost"
port = 7000
s.setsockopt( socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind((host, port))

s.listen(5)

def __handlepeer(client):
    peer_host, peer_port = client.getpeername()
    peerconn = BTPeerConnection(None, peer_host, peer_port, client, debug=False)
    print("here")
    while True:
        try:
            msgtype, msgdata = peerconn.recvdata()
            print(msgtype, msgdata)
        except KeyboardInterrupt:
            raise

    peerconn.close()

while True:
    clientsock, addr = s.accept()
    clientsock.send('You are now connected to {}:{}'.format(host, port))
    t = threading.Thread(target=__handlepeer, args=[clientsock])
    t.start()
