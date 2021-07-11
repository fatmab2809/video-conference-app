import React, { useRef, useEffect } from "react";
import io from "socket.io-client";
import { Button } from '@material-ui/core';

const Rooms = (props) => {
    const myVideo = useRef();       // video of the room creator
    const user2Video = useRef();    // video of the other user who will join
    const refPeer = useRef();
    const refSocket = useRef();
    const user2 = useRef();
    const streamUser = useRef();       // stream of the user

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {  // grant access to user's video and audio
            myVideo.current.srcObject = stream;
            streamUser.current = stream;

            refSocket.current = io.connect("/");    //connect to socket.io server
            refSocket.current.emit("join room", props.match.params.meetID);     // pulling out room ID from the URL

            refSocket.current.on('other user', userID => {  // get the ID of user2
                callUser(userID);
                user2.current = userID;
            });

            refSocket.current.on("user joined", userID => { 
                user2.current = userID;
            });
            refSocket.current.on("disconnect", leave);

            refSocket.current.on("request", handleReceivingcall);

            refSocket.current.on("answerCall", handleAnswerCall);

            refSocket.current.on("iceCandidate", handleNewICECandidateMsg);
        });

    }, []);

    function callUser(userID) {
        refPeer.current = createPeer(userID);   
        streamUser.current.getTracks().forEach(track => refPeer.current.addTrack(track, streamUser.current));
    }

    function createPeer(userID) {   // build a webRTC peer object
        const peers = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.stunprotocol.org"
                },
                {
                    urls: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                },
            ]
        });
        
        peers.ontrack = handleTrackEvent;
        peers.onnegotiationneeded = () => handleNegotiationNeededEvent(userID); // define negotiation process
        peers.onicecandidate = handleICECandidateEvent; // handles ICE Candidate events

        return peers;
    }

    function handleReceivingcall(incoming) {
        refPeer.current = createPeer();
        const desc = new RTCSessionDescription(incoming.sdp);
        refPeer.current.setRemoteDescription(desc).then(() => {
            streamUser.current.getTracks().forEach(track => refPeer.current.addTrack(track, streamUser.current));
        }).then(() => {
            return refPeer.current.createAnswer();
        }).then(answerCall => {
            return refPeer.current.setLocalDescription(answerCall);
        }).then(() => {
            const payload = {
                target: incoming.caller,
                caller: refSocket.current.id,
                sdp: refPeer.current.localDescription
            }
            refSocket.current.emit("answerCall", payload);
        })
    }

    function handleNegotiationNeededEvent(userID) {
        refPeer.current.createOffer().then(request => {
            return refPeer.current.setLocalDescription(request);
        }).then(() => {
            const payload = {
                target: userID,
                caller: refSocket.current.id,
                sdp: refPeer.current.localDescription
            };
            refSocket.current.emit("request", payload);
        }).catch(e => console.log(e));
    }

    function handleICECandidateEvent(e) {
        if (e.candidate) {
            const payload = {
                target: user2.current,
                candidate: e.candidate,
            }
            refSocket.current.emit("iceCandidate", payload);
        }
    }

    function handleAnswerCall(message) {
        const desc = new RTCSessionDescription(message.sdp);
        refPeer.current.setRemoteDescription(desc).catch(e => console.log(e));
    }

    function handleNewICECandidateMsg(incoming) {
        const candidate = new RTCIceCandidate(incoming);

        refPeer.current.addIceCandidate(candidate)
            .catch(e => console.log(e));
    }

    function handleTrackEvent(e) {
        user2Video.current.srcObject = e.streams[0];
    };

    const leave = () => {   // takes back to the homepage when user leaves the call
        window.location.href = "http://localhost:3000/";
    };
    
    return (
        <div>
            <video style={{margin :'20px'}} xs={12} md={6} autoPlay muted ref={myVideo} />
            <video style={{margin :'20px'}} xs={12} md={6} autoPlay ref={user2Video} />
            <Button style={{display: 'inline-block'}}  variant="contained" color="secondary" onClick={leave}>Leave Call </Button>
        </div>
    );
};

export default Rooms;