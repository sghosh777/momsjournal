# My Mom Couldn't Remember My First Smile. So I Built an App to Make Sure I Never Forget My Baby's.

A few weeks ago, I called my mom and asked her a simple question: *"Do you remember when I gave my first smile?"*

There was a long pause. She laughed a little, then said, *"Oh, you smiled a lot... I think it was around two months? Maybe three?"*

She wasn't sure. And honestly, how could she be? It was decades ago. There were no smartphones, no quick way to jot it down in the moment. Life was happening fast, and the little details — the ones that feel so monumental when they're right in front of you — just slipped away.

That conversation stuck with me. Because now I'm the parent. And I'm watching these moments happen every day — the first smile, the first time she grabbed my finger, the look on her face when she heard music for the first time. I don't want to forget any of it.

## The Problem With the Obvious Solutions

My first instinct was: I already have Google Photos. Every picture is backed up automatically. Problem solved, right?

Not quite. Google Photos captures **what happened**, but it completely misses **the story**. It doesn't know that the blurry photo from Tuesday morning was taken right after she laughed for the first time at the dog. It doesn't capture that I was exhausted but so full of joy I cried. The photo is there. The moment behind it is not.

Then there's social media. I know some parents love sharing on Instagram, and that's great for them — but it's not for me. I'm not comfortable putting my baby's face out there for the world to scroll past. These moments are personal. They belong to our family, not to an algorithm.

But here's the thing — my family is *obsessed* with getting pictures. My parents, my in-laws, aunts, cousins — everyone wants updates. The group chat is basically a 24/7 request line: *"Send more photos!" "How is she today?" "We need videos!"* (They're somewhat addicted to it, honestly.) I love that they care so much, but keeping up with everyone's requests while also, you know, raising a baby — it's a lot.

So I had a real problem:
- I wanted to capture moments **with the story**, not just the photo
- I didn't want to post on social media
- My family needed a way to see updates **without me manually sending them to everyone**
- And nothing out there did all three

## So I Built It. With AI.

I'm not a mobile app developer. I don't write Swift or Kotlin. A year ago, building a fully functional mobile app would have been a side project that took months — the kind of thing that lives on a to-do list forever.

But we're living in a different world now. Remember that magic pencil from those kids' stories — the one where whatever you draw becomes real? AI is basically that, except instead of drawing a door on a wall and walking through it, you describe the app you want and it... just starts existing. (And unlike the magic pencil, nobody gets chased by an angry bull they accidentally doodled.)

I used Claude as my development partner and built **Mom's Journal** from idea to working app. I didn't just ask AI to "make me an app." I worked *with* it. I described the problem. I made product decisions. I designed the experience I wanted. AI handled the heavy lifting of turning those decisions into working code — the kind of work that used to require a team of engineers and weeks of sprints. I was the product manager, the designer, and the QA tester. AI was the engineering team that never pushed back on a deadline.

Here's what the app does:

**For me (the parent):** I open the app, write a quick entry about what just happened, attach a photo or video, pick my mood, and save it. It takes 30 seconds. The entry is timestamped, searchable, and mine forever. It's a journal, not a feed.

**For my family:** I add them to "My Circle." When I share a moment, they get a text message with the photo and a link. They tap the link, and they're in — they can see everything I've chosen to share, get push notifications for new posts, and browse at their own pace. No app store download required. No account creation. Just a link.

**For privacy:** Every entry is private by default. I choose what to share and with whom. Nothing goes on social media. Nothing is public. My baby's moments stay in our family.

## The Part That Surprises People

When I show this to colleagues, the first thing they do is try to find it in the App Store.

It's not there. And it doesn't need to be.

Mom's Journal is what's called a Progressive Web App — or PWA. In plain English: it's a website that behaves like an app. When my family opens the link on their phone, they get a prompt to "Add to Home Screen." One tap, and it's right there on their phone next to Instagram and WhatsApp — with its own icon, opening fullscreen, sending notifications. It looks and feels like any app they've ever downloaded.

The difference? **Distribution is just a link.** I text it to my mom. She taps it. She's in. No searching the App Store. No downloads. No updates to install. She didn't even know it wasn't a "real" app until I told her.

This matters because the hardest part of any app isn't building it — it's getting people to actually install it. With a link, that problem disappears.

**If you're curious about PWAs, here's why they're worth knowing about:**

Think of it this way — the App Store and Google Play are like retail stores. You build a product, submit it for approval, pay for shelf space, and hope people find it. A PWA is more like handing someone exactly what they need, directly. No middleman.

Some of the biggest names already use PWAs: Twitter Lite, Starbucks, Pinterest, and Uber all have Progressive Web App versions. Starbucks reported that their PWA is 99.84% smaller than their iOS app and doubled the number of daily active users who order on the web.

Here's what makes PWAs powerful for teams thinking about building tools or products:

- **No app store fees or approval process.** You deploy on your timeline, not Apple's.
- **One codebase, every platform.** Works on iPhones, Android phones, tablets, desktops — all from the same website.
- **Instant updates.** Users always have the latest version. No more "please update your app" friction.
- **Works offline.** PWAs can cache content so they load even without internet — great for field teams, travel, or spotty connections.
- **Push notifications.** Yes, just like native apps. Your PWA can ping users when something important happens.
- **Free to host.** Services like GitHub Pages, Firebase, Netlify, and Vercel offer free hosting for PWAs.

The things PWAs *can't* do well — like accessing Bluetooth, NFC, or doing heavy background processing — don't apply to most business tools, internal apps, or content products. If you're building a 3D game, go native. For almost everything else, a PWA will get you there faster and cheaper.

**Want to try it yourself?** You don't need to be an engineer. Grab an AI assistant, describe what you want to build, and ask it to make it a PWA. The AI knows what that means and will set it up for you. That's literally how I did it.

## What I Didn't Expect: Other People Want It Too

Here's something I didn't plan for. Every time I show Mom's Journal to someone — a demo at work, a casual conversation at a dinner — the reaction is the same. First it's "oh that's cool," and then it's "wait, can I use this?"

A few of my girlfriends who are also new moms have started using it. They had the exact same problem: a camera roll full of thousands of photos with no story attached, family group chats blowing up for updates, and no interest in turning their baby into an Instagram brand. They opened the link, added it to their home screen, and started journaling that same day.

I built this to solve my own problem. I didn't set out to build a product. But it turns out when you solve a real problem well, people just... want it. And because it's a PWA, sharing it is as easy as sending a link. There's no "go download it from the store and search for..." — it's just *here, tap this*.

## What This Means (Beyond My Baby Photos)

I'm sharing this story not just because I'm proud of the app (though I am — and apparently so are my friends who keep sending me screenshots of their entries). I'm sharing it because it changed how I think about solving problems at work.

**The gap between "idea" and "working product" has collapsed.** I went from a conversation with my mom to a fully functional app — with a database, user authentication, photo storage, push notifications, and SMS alerts — in a fraction of the time it would have taken even a year ago. Not because I cut corners, but because AI handled the implementation complexity while I focused on the product decisions.

**You don't need an app store to distribute software.** If your team is thinking about building an internal tool, a client portal, a field app, or a customer-facing utility — consider a PWA before defaulting to the App Store. It's faster to ship, easier to update, and costs nothing to distribute.

**AI-first doesn't mean replacing people. It means removing the bottleneck between having an idea and making it real.** I'm a product-minded person who used AI to build something that solved a real problem for my family. That same approach applies to work — identifying pain points, prototyping fast, validating with real users, and iterating.

## The Takeaway

My mom doesn't remember my first smile. That's okay — she gave me a thousand other things I'll never forget.

But when my daughter grows up and asks me the same question, I'll open Mom's Journal, scroll to the entry, and tell her the whole story — what she looked like, what I was feeling, what song was playing in the background. Because I captured it in 30 seconds on an app I built in a conversation with AI.

The tools are here. The question isn't whether AI can help you build things. It's what problem you're going to solve first.

---

*Mom's Journal is open source on [GitHub](https://github.com/sghosh777/momsjournal). If you want to try it or build something similar, reach out — I'm happy to share what I learned.*
