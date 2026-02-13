const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

// Twilio secrets (set via: firebase functions:secrets:set TWILIO_ACCOUNT_SID, etc.)
const twilioSid = defineSecret("TWILIO_ACCOUNT_SID");
const twilioAuth = defineSecret("TWILIO_AUTH_TOKEN");
const twilioPhone = defineSecret("TWILIO_PHONE_NUMBER");

exports.onSharedEntry = onDocumentCreated(
  {
    document: "entries/{entryId}",
    secrets: [twilioSid, twilioAuth, twilioPhone],
  },
  async (event) => {
    const entry = event.data?.data();
    if (!entry) return;

    // Only send SMS for shared entries
    if (entry.visibility !== "shared") {
      console.log("Entry is private, skipping SMS");
      return;
    }

    const userId = entry.userId;
    if (!userId) {
      console.error("No userId on entry");
      return;
    }

    // Get the user's friends
    const db = getFirestore();
    const friendsSnap = await db
      .collection("friends")
      .where("userId", "==", userId)
      .get();

    if (friendsSnap.empty) {
      console.log("No friends in circle, skipping SMS");
      return;
    }

    // Get the user's display name from Firebase Auth
    const { getAuth } = require("firebase-admin/auth");
    let senderName = "A mama";
    try {
      const userRecord = await getAuth().getUser(userId);
      senderName = userRecord.displayName || "A mama";
    } catch (err) {
      console.warn("Could not get user display name:", err.message);
    }

    // Build the message
    const moodEmojis = {
      love: "🥰",
      happy: "😊",
      tired: "😴",
      grateful: "🙏",
      proud: "🌟",
      silly: "🤪",
    };

    let body = `💌 ${senderName} shared a moment with you!\n\n`;
    if (entry.mood && moodEmojis[entry.mood]) {
      body += `Feeling ${moodEmojis[entry.mood]} ${entry.mood}\n\n`;
    }
    if (entry.text) {
      body += `"${entry.text}"\n\n`;
    }
    body += "— from Mom's Journal 🌸";

    // Send via Twilio
    const twilio = require("twilio")(
      twilioSid.value(),
      twilioAuth.value()
    );
    const fromPhone = twilioPhone.value();

    const results = await Promise.allSettled(
      friendsSnap.docs.map(async (friendDoc) => {
        const friend = friendDoc.data();
        const msgOptions = {
          body,
          from: fromPhone,
          to: friend.phone,
        };

        // If entry has a photo, send as MMS
        if (entry.photo) {
          msgOptions.mediaUrl = [entry.photo];
        }

        const message = await twilio.messages.create(msgOptions);
        console.log(
          `SMS sent to ${friend.name} (${friend.phone}): ${message.sid}`
        );
        return message.sid;
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    console.log(
      `Sent ${succeeded} SMS, ${failed} failed out of ${friendsSnap.size} friends`
    );

    // Log failures for debugging
    results
      .filter((r) => r.status === "rejected")
      .forEach((r) => console.error("SMS send failed:", r.reason));
  }
);
