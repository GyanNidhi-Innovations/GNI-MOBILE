import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
} from "react-native-webrtc";

const SIGNALING_BASE = "https://demos.gyannidhi.in/premises-stream";
const WS_BASE = "wss://demos.gyannidhi.in/premises-stream/ws";

const fetchTurnConfig = async () => {
  const res = await fetch(`${SIGNALING_BASE}/api/turn`);

  if (!res.ok) {
    throw new Error("Failed to fetch TURN config");
  }

  return await res.json();
};

export const startPremisesLiveStream = async ({ room, attempt }) => {
  const turnConfig = await fetchTurnConfig();

  const stream = await mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "environment",
      width: 640,
      height: 480,
      frameRate: 15,
    },
  });

  const pc = new RTCPeerConnection({
    iceServers: turnConfig?.iceServers || [],
  });

  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream);
  });

  const wsUrl =
    `${WS_BASE}?room=${encodeURIComponent(room)}` +
    `&role=premises&attempt=${encodeURIComponent(attempt || "")}`;

  const ws = new WebSocket(wsUrl);

  let viewerPeerId = null;
  let started = false;

  const send = (payload) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  };

  const createAndSendOffer = async (toPeerId) => {
    if (started) return;
    started = true;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    send({
      type: "offer",
      to: toPeerId,
      offer,
      room,
      role: "premises",
      attempt,
    });
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      send({
        type: "ice-candidate",
        to: viewerPeerId || undefined,
        candidate: event.candidate,
      });
    }
  };

  ws.onmessage = async (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "joined") {
      const existingViewer = (msg.peers || []).find(
        (peer) => peer.role === "viewer"
      );

      if (existingViewer?.peerId) {
        viewerPeerId = existingViewer.peerId;
        await createAndSendOffer(viewerPeerId);
      }
    }

    if (msg.type === "peer-joined" && msg.role === "viewer") {
      viewerPeerId = msg.peerId;
      await createAndSendOffer(viewerPeerId);
    }

    if (msg.type === "answer") {
      await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
    }

    if (msg.type === "ice-candidate" && msg.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
    }

    if (msg.type === "peer-left" && msg.peerId === viewerPeerId) {
      viewerPeerId = null;
      started = false;
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error("WebSocket signaling failed"));
  });

  return {
    stream,
    pc,
    ws,
    stop: () => {
      try {
        stream.getTracks().forEach((track) => track.stop());
      } catch {}

      try {
        pc.close();
      } catch {}

      try {
        ws.close();
      } catch {}
    },
  };
};