# Skip the App Store: How I Built and Distributed a Mobile App Using Just a Website

You don't need the App Store or Google Play to put an app on someone's phone. I built **Mom's Journal** — a mobile app for new moms to capture moments with their babies — and distributed it entirely through a URL. No $99/year Apple developer fee. No review process. No waiting.

Here's how, and why you might want to do the same.

## What's a Progressive Web App?

A Progressive Web App (PWA) is a website that behaves like a native app. When someone visits your site on their phone, the browser offers to "Add to Home Screen." Once they do, it launches fullscreen — no address bar, no browser chrome. It looks and feels like something they downloaded from a store.

Mom's Journal does exactly this. Open the link, tap "Add to Home Screen," and you've got an app icon sitting right next to Instagram and WhatsApp. It launches instantly, works offline, and sends push notifications when grandma shares a new photo.

The user doesn't know or care that it's "just a website." It's an app on their phone. That's what matters.

## What Makes a Website a PWA?

You need three things:

**1. A Web App Manifest**

A small JSON file that tells the browser your app's name, icons, colors, and how it should launch.

```json
{
  "name": "Mom's Journal",
  "short_name": "MomsJournal",
  "start_url": "/momsjournal/",
  "display": "standalone",
  "theme_color": "#FFF0F5",
  "icons": [
    { "src": "icons/icon-192.svg", "sizes": "192x192" },
    { "src": "icons/icon-512.svg", "sizes": "512x512" }
  ]
}
```

The key line is `"display": "standalone"` — that's what removes the browser UI and makes it feel native.

**2. A Service Worker**

A small script that sits between your app and the network. It caches your app shell so it loads instantly on repeat visits, and it can handle push notifications. For Mom's Journal, the service worker uses a network-first strategy — try to fetch fresh content, fall back to cache if offline.

**3. HTTPS**

PWAs require a secure connection. If you're hosting on GitHub Pages, Firebase, or Netlify, you get this for free.

That's it. Those three pieces turn your React app (or Vue, or Svelte, or plain HTML) into something installable.

## How I Distribute It

This is the best part. Distribution is a link. I text it to people. I put it in a group chat. I email it. There's no friction.

For Mom's Journal, the flow looks like this:

1. Mom visits the link on her phone
2. She signs in with Google
3. The app prompts "Add to Home Screen"
4. She taps it — done. App installed.

When she wants to share moments with family, she sends them an invite link. They open it, sign in, and get prompted to install too. The app even asks if they want push notifications so they know when new moments are posted.

No one had to search an app store. No one had to remember my app's name among millions of results. No one had to wait for a download. The app is **the link**.

## The Stack Behind It

Mom's Journal is a React app built with Vite and hosted on **GitHub Pages** (free). The backend runs on **Firebase** — Firestore for the database, Cloud Storage for photos and videos, Firebase Auth for Google sign-in, and Cloud Functions for sending push notifications and SMS alerts via Twilio.

The entire hosting cost for the frontend is $0. Firebase's free tier covers a surprising amount of usage before you'd ever need to pay.

The deployment is fully automated with GitHub Actions. Push to the main branch, and the app builds and deploys to GitHub Pages in about a minute.

## What PWAs Can and Can't Do

Let's be honest about the tradeoffs.

**PWAs can:**
- Install to the home screen with a custom icon
- Work offline (cached content)
- Send push notifications (Android and desktop; limited on iOS)
- Access the camera, GPS, and other device APIs
- Auto-update (no user action needed — they just get the latest version)

**PWAs can't (or struggle to):**
- Access Bluetooth, NFC, or advanced hardware APIs
- Run heavy background processes
- Get featured in app store search results
- Use iOS push notifications reliably (it works on iOS 16.4+ but is still catching up)

For many apps — especially content apps, journals, dashboards, tools, and social sharing — PWAs are more than enough.

## Why Not Just Build a Native App?

I considered it. Here's why I didn't:

- **Cost**: Apple charges $99/year. Google charges a one-time $25. PWA costs $0.
- **Time**: One codebase for all platforms. I'm not maintaining separate Swift and Kotlin projects.
- **Review process**: App Store reviews take days and can reject you for arbitrary reasons. With a PWA, I deploy when I want.
- **Updates**: Users always get the latest version. No "please update your app" screens.
- **Distribution**: A URL is more shareable than an app store listing. For a family-focused app, this matters.

The app store model makes sense for games, complex native experiences, and apps that need maximum discoverability. For everything else, it's overhead.

## How to Get Started

If you have an existing web app and want to make it installable:

1. **Create a `manifest.json`** in your public folder with your app's name, icons, and `"display": "standalone"`.
2. **Add a service worker** — even a basic one that caches your app shell. Google's Workbox library makes this easy if you don't want to write one from scratch.
3. **Link the manifest** in your `index.html`: `<link rel="manifest" href="/manifest.json">`
4. **Register the service worker** in your main JavaScript file.
5. **Deploy to HTTPS** — GitHub Pages, Firebase Hosting, Netlify, or Vercel all work.

Test with Chrome DevTools (Application tab) to verify everything is set up. Lighthouse will also audit your PWA and tell you what's missing.

## The Takeaway

The app store isn't the only way to get an app on someone's phone. For Mom's Journal, a PWA was the right call — fast to build, free to host, and dead simple to share. A link is the most frictionless install experience there is.

If you're building something and the app store feels like overkill, give PWAs a serious look. You might not need it.

---

*Mom's Journal is open source. Check it out on [GitHub](https://github.com/sghosh777/momsjournal).*
