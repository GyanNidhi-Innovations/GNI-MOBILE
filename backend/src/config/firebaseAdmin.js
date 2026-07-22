import admin from "firebase-admin";

let firebaseApp;

export function initFirebaseAdmin() {
  if (firebaseApp || admin.apps.length) {
    return firebaseApp || admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
    );
  }

  console.log(
  "[PUSH-DEBUG][FIREBASE] Admin configuration",
  {
    projectId,

    clientEmailDomain:
      String(clientEmail || "")
        .split("@")[1] || null,
  },
);

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  console.log("✅ Firebase initialized");
  return firebaseApp;
}

export { admin };



