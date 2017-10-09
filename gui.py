#!/usr/bin/python

from appJar import gui

ip = "0.0.0.0"


def subWindowButtons(button):
	if button == "Cancel":
		app.hideSubWindow("settings")
	if button == "Submit":
		ip = app.getEntry("ipEnt")
		app.hideSubWindow("settings")
		app.setLabel("ip", "Connection: " + ip)

def openSettings(button):
	app.showSubWindow("settings")

def sendMessage(button):
	msg = app.getEntry("Chat")
	if not msg == "":
		app.clearEntry("Chat")
		app.setTextArea("Conversation", "You : " + msg + "\n", end=True, callFunction=True)
		# SEND MSG THROUGH SOCKET

def receiveMessage(msg):
	# SEND MSG THROUGH SOCKET
	if not msg == "":
		app.setTextArea("Conversation", "Sender : " + msg + "\n", end=True, callFunction=True)



app = gui("Login Window", "600x500")

# CREATE MAIN WINDOW
app.addLabel("title", "Welcome to McMessage")
app.setLabelBg("title", "red")
app.addLabel("ip", "Connection: " + ip)
app.addScrolledTextArea("Conversation")
app.addLabelEntry("Chat")
app.addButton("Send", sendMessage)
app.addButton("Setup connection", openSettings)

# GENERATE SETTINGS SUBWINDOW
app.startSubWindow("settings", modal=True)
app.addLabel("userIp", "Connection IP:", 0, 0)
app.addEntry("ipEnt", 0, 1)
app.addButtons( ["Submit", "Cancel"], subWindowButtons, colspan=2)
app.stopSubWindow()

app.go()

