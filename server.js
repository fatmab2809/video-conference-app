const http = require("http");
const express = require("express");
const app = express();  // created express app
const server = http.createServer(app);
const socket = require("socket.io"); // create socket.io instance
const io = socket(server);
// const path = require("path");

const meetingRoom = {};     // create the meeting room for video chatting

io.on("connection", socket => {     // when person is connected
    socket.on("join room", meetID => {      // join room event listener
        if (meetingRoom[meetID]) {
            meetingRoom[meetID].push(socket.id);
        } else {
            meetingRoom[meetID] = [socket.id];
        }
        const user2 = meetingRoom[meetID].find(id => id !== socket.id); // check if 2 persons are in a room
        if (user2) {
            socket.emit("other user", user2);
            socket.to(user2).emit("user joined", socket.id);
        }
    });

    socket.on("disconnect", () => {     // to end the meeting
		socket.broadcast.emit("EndCall")
	});

    socket.on("request", payload => {       // offer made to the user
        io.to(payload.target).emit("request", payload);
    });

    socket.on("answerCall", payload => {    // user2 answers the call made by user1
        io.to(payload.target).emit("answerCall", payload);
    });

    socket.on("iceCandidate", incoming => {     // for ice servers
        io.to(incoming.target).emit("iceCandidate", incoming.candidate);
    });
});

server.listen(8000, () => console.log('server is running on port 8000'));   // to listen on port 8000
