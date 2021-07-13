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
    let localStream;

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            .then(stream => {
            localStream = stream;
            document.getElementById("local-video").srcObject = localStream;
            myVideo.current.srcObject = stream;
            streamUser.current = stream;

            refSocket.current = io.connect("/");
            refSocket.current.emit("join room", props.match.params.meetID);

            refSocket.current.on('other user', userID => {
                callUser(userID);
                user2.current = userID;
            });

            refSocket.current.on("user joined", userID => {
                user2.current = userID;
            });
            refSocket.current.on("disconnect", leave);
            refSocket.current.on("close Video", muteVideo);
            refSocket.current.on("mute audio", muteAudio);
            refSocket.current.on("request", handleRecieveCall);

            refSocket.current.on("answerCall", handleAnswer);

            refSocket.current.on("iceCandidate", handleNewICECandidateMsg);
        });

    }, []);

    function callUser(userID) {
        refPeer.current = createPeer(userID);
        streamUser.current.getTracks().forEach(track => refPeer.current.addTrack(track, streamUser.current));
    }

    function createPeer(userID) {
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

        peers.onicecandidate = handleICECandidateEvent;
        peers.ontrack = handleTrackEvent;
        peers.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);

        return peers;
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

    function handleRecieveCall(incoming) {
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

    function handleAnswer(message) {
        const desc = new RTCSessionDescription(message.sdp);
        refPeer.current.setRemoteDescription(desc).catch(e => console.log(e));
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

    function handleNewICECandidateMsg(incoming) {
        const candidate = new RTCIceCandidate(incoming);

        refPeer.current.addIceCandidate(candidate)
            .catch(e => console.log(e));
    }

    function handleTrackEvent(e) {
        user2Video.current.srcObject = e.streams[0];
    };

    const leave = () => {
        window.location.href = "http://localhost:3000";
    };

    const muteAudio = () => {
        const enabled = localStream.getAudioTracks()[0].enabled;
        if (enabled) {
            localStream.getAudioTracks()[0].enabled = false;
            setUnmuteButton();
        } else {
            setMuteButton();
            localStream.getAudioTracks()[0].enabled = true;
        }
    }
    const setUnmuteButton = () => {
        const html = `<span>Unmute</span>`
        document.querySelector('.main__mute_button').innerHTML = html;
    }
    const setMuteButton = () => {
        const html = `<span>Mute</span>`
        document.querySelector('.main__mute_button').innerHTML = html;
    }

    const muteVideo = () => {
        console.log('object')
        let enabled = localStream.getVideoTracks()[0].enabled;
        if (enabled) {
            localStream.getVideoTracks()[0].enabled = false;
            setPlayVideo();
        } else {
            setStopVideo();
            localStream.getVideoTracks()[0].enabled = true;
        }
    }
    const setStopVideo = () => {
        const html = `<span>Turn Video Off</span>`
        document.querySelector('.main__video_button').innerHTML = html;
      }
      
      const setPlayVideo = () => {
        const html = `<span>Turn Video On</span>`
        document.querySelector('.main__video_button').innerHTML = html;
      }
    return (
        <div>
            <video id="local-video" style={{margin :'20px'}} xs={12} md={6} autoPlay muted ref={myVideo} />
            <video style={{margin :'20px'}} xs={12} md={6} autoPlay ref={user2Video} />
            <Button style={{display: 'inline-block'}}  variant="contained" color="secondary" onClick={leave}>Leave Call </Button>
            <div class="call-action-div">
                <Button variant="contained" color="primary" onClick={muteVideo} className="main__video_button">Turn Video Off</Button>
                <Button variant="contained" onClick={muteAudio} className="main__mute_button">Mute</Button>
            </div>
        </div>
    );
};

export default Rooms;