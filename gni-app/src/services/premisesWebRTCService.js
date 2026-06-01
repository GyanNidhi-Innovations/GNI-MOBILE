import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
} from "react-native-webrtc";

const PREMISES_BASE = "https://demos.gyannidhi.in/premises";
const WS_BASE = "wss://demos.gyannidhi.in/signaling/ws";

const fetchTurnConfig = async () => {
  const res = await fetch(`${PREMISES_BASE}/api/turn`);

  if (!res.ok) {
    throw new Error("Failed to fetch TURN config");
  }

  return await res.json();
};

export const startHireAIPremisesLiveStream = async ({ room, candidateId }) => {
  console.log("HIREAI WEBRTC START", { room, candidateId });

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
    `&role=capture&candidate_id=${encodeURIComponent(candidateId || "")}`;

  console.log("HIREAI WS URL:", wsUrl);

  const ws = new WebSocket(wsUrl);

  let viewerPeerId = null;
  let offerSent = false;

  const send = (payload) => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log("HIREAI WS SEND:", payload.type);
      ws.send(JSON.stringify(payload));
    }
  };

  const createAndSendOffer = async (toPeerId) => {
  if (!toPeerId) return;
  if (offerSent) {
    console.log("HIREAI offer already sent, skipping duplicate");
    return;
  }

  offerSent = true;
  viewerPeerId = toPeerId;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  send({
    type: "offer",
    to: toPeerId,
    sdp: offer.sdp,
  });

  console.log("HIREAI offer sent to", toPeerId);
};

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      send({
        type: "candidate",
        to: viewerPeerId || undefined,
        candidate: event.candidate,
      });
    }
  };

  pc.onconnectionstatechange = () => {
    console.log("HIREAI PC state:", pc.connectionState);
  };

  ws.onmessage = async (event) => {
    let msg;

    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    console.log("HIREAI WS RECV:", msg.type, msg.role || msg._from?.role);

    if (msg.type === "joined") {
      const viewer = (msg.peers || []).find(
        (p) => p.role === "interviewer" || p.role === "viewer"
      );

      if (viewer?.peerId) {
        await createAndSendOffer(viewer.peerId);
      }

      return;
    }

    if (
      msg.type === "peer-joined" &&
      (msg.role === "interviewer" || msg.role === "viewer")
    ) {
      await createAndSendOffer(msg.peerId);
      return;
    }

    if (msg.type === "viewer-ready" && msg._from?.peerId) {
      await createAndSendOffer(msg._from.peerId);
      return;
    }

if (msg.type === "answer" && msg.sdp) {
  if (pc.signalingState !== "have-local-offer") {
    console.log("Skipping duplicate answer, state:", pc.signalingState);
    return;
  }

  await pc.setRemoteDescription(
    new RTCSessionDescription({
      type: "answer",
      sdp: msg.sdp,
    })
  );

  console.log("HIREAI answer set");
  return;
}

    if (msg.type === "candidate" && msg.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
      } catch (e) {
        console.log("HIREAI add candidate failed", e);
      }
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = () => {
      console.log("HIREAI WS OPEN");
      resolve();
    };

    ws.onerror = (e) => {
      console.log("HIREAI WS ERROR", e);
      reject(new Error("HireAI premises signaling failed"));
    };
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