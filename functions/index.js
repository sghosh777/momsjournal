const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

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

    // Only send notifications for shared entries
    if (entry.visibility !== "shared") {
      console.log("Entry is private, skipping notifications");
      return;
    }

    const userId = entry.userId;
    if (!userId) {
      console.error("No userId on entry");
      return;
    }

    const db = getFirestore();

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

    const entryId = event.params.entryId;
    const shareLink = `https://sghosh777.github.io/momsjournal/#/shared/${entryId}`;

    let textBody = `💌 ${senderName} shared a moment with you!\n\n`;
    if (entry.mood && moodEmojis[entry.mood]) {
      textBody += `Feeling ${moodEmojis[entry.mood]} ${entry.mood}\n\n`;
    }
    if (entry.text) {
      textBody += `"${entry.text}"\n\n`;
    }
    textBody += `View it here: ${shareLink}\n\n`;
    textBody += "— Mom's Journal 🌸";

    // --- 1) Send push notifications to web subscribers ---
    const subscribersSnap = await db
      .collection("pushSubscribers")
      .where("userId", "==", userId)
      .get();

    if (!subscribersSnap.empty) {
      const tokens = subscribersSnap.docs.map((d) => d.data().token);
      const pushTitle = `${senderName} shared a new moment 🌸`;
      let pushBody = "";
      if (entry.mood && moodEmojis[entry.mood]) {
        pushBody += `Feeling ${moodEmojis[entry.mood]} ${entry.mood}`;
      }
      if (entry.text) {
        pushBody += pushBody ? " — " : "";
        pushBody += entry.text.length > 80 ? entry.text.slice(0, 80) + "..." : entry.text;
      }
      if (!pushBody) pushBody = "Tap to view the moment";

      try {
        const pushResult = await getMessaging().sendEachForMulticast({
          tokens,
          notification: {
            title: pushTitle,
            body: pushBody,
          },
          webpush: {
            fcmOptions: {
              link: shareLink,
            },
          },
        });

        console.log(
          `Push: ${pushResult.successCount} sent, ${pushResult.failureCount} failed out of ${tokens.length}`
        );

        // Clean up invalid tokens
        const invalidTokens = [];
        pushResult.responses.forEach((resp, idx) => {
          if (
            !resp.success &&
            (resp.error?.code === "messaging/invalid-registration-token" ||
              resp.error?.code === "messaging/registration-token-not-registered")
          ) {
            invalidTokens.push(tokens[idx]);
          }
        });

        if (invalidTokens.length > 0) {
          const batch = db.batch();
          subscribersSnap.docs.forEach((d) => {
            if (invalidTokens.includes(d.data().token)) {
              batch.delete(d.ref);
            }
          });
          await batch.commit();
          console.log(`Cleaned up ${invalidTokens.length} invalid push tokens`);
        }
      } catch (pushErr) {
        console.error("Push notification error:", pushErr);
      }
    } else {
      console.log("No push subscribers for this user");
    }

    // --- 2) Send SMS via Twilio ---
    const friendsSnap = await db
      .collection("friends")
      .where("userId", "==", userId)
      .get();

    if (friendsSnap.empty) {
      console.log("No friends in circle, skipping SMS");
      return;
    }

    const twilio = require("twilio")(
      twilioSid.value(),
      twilioAuth.value()
    );
    const fromPhone = twilioPhone.value();

    const results = await Promise.allSettled(
      friendsSnap.docs.map(async (friendDoc) => {
        const friend = friendDoc.data();
        const msgOptions = {
          body: textBody,
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
