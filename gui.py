#!/usr/bin/python
import threading
import node
from appJar import gui
import json

class App:
	server_ip = "127.0.0.1"
	server_port = "3000"
	chat_name = "Test"
	app = gui("Login Window", "600x500")
	local_client_port = ""

	def __init__(self):
		# CREATE MAIN WINDOW
		self.app.addLabel("title", "Welcome to McMessage")
		self.app.setLabelBg("title", "red")
		self.app.addLabel("server_ip")
		self.app.addScrolledTextArea("main_text_area")
		self.app.addLabelEntry("Chat")
		self.app.addButton("Send", self.sendMessage)

		# GENERATE SETTINGS SUBWINDOW
		self.app.startSubWindow("config", title="Config", modal=True)
		self.app.addLabel(title="server_ip_label", text="Server IP:", row=0, column=0)
		self.app.addEntry("server_ip_ent", row=0, column=1)
		self.app.addLabel(title="port_label", text="Server port:", row=1, column=0)
		self.app.addEntry("server_port_ent", 1, 1)
		self.app.addLabel(title="chat_name_label", text="Chat name:", row=2, column=0)
		self.app.addEntry("chat_name_ent", 2, 1)
		self.app.addButtons( ["Submit"], self.handleServerIPSubmit, colspan=2)
		self.app.stopSubWindow()

		self.app.showSubWindow("config")
		self.app.setFocus("server_ip_ent")

		self.app.go()

	def handleServerIPSubmit(self, button):
		self.app.hideSubWindow("config")
		self.server_ip = self.app.getEntry("server_ip_ent")
		self.server_port = self.app.getEntry("server_port_ent")
		self.chat_name = self.app.getEntry("chat_name_ent")
		self.app.setLabel("server_ip", "Server connection: " + self.server_ip + ":" + self.server_port)
		self.app.setLabel("title", "Welcome to McMessage, " + self.chat_name)
		self.app.setTextArea("main_text_area", "Connecting to chat...")
		self.app.setFocus("Chat")
		threading.Thread(target=node.startNodeClient, args=(self.server_ip, self.server_port, self.chat_name)).start()
		self.app.thread(self.listenForMessages)

	def sendMessage(self, button):
		msg = self.app.getEntry("Chat")
		if msg and self.local_client_port:

			self.app.clearEntry("Chat")
			self.app.setTextArea("main_text_area", "You : " + msg + "\n", end=True, callFunction=True)
			node.send(msg, self.local_client_port)

	def receiveMessage(msg):
		if msg:
			app.setTextArea("main_text_area", "Sender : " + msg + "\n", end=True, callFunction=True)

	def listenForMessages(self):
		while True:
			data = node.socket.recv(1024) # buffer size is 1024 bytes
			msg = json.loads(data)
			if msg["type"] == "connect":
				self.app.setTextArea("main_text_area", "Connected!\n")
				self.local_client_port = msg["port"]
			if msg["type"] == "message":
				self.app.setTextArea("main_text_area", msg["message"] + "\n")
			if msg["type"] == "chat":
				self.app.setTextArea("main_text_area", "{0}: {1}\n".format(msg["name"], msg["content"]))

app = App()
