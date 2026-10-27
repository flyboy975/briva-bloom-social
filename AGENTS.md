<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Social data (profiles, posts, likes, comments, post photos) is readable only by signed-in members; signed-out visitors see a join prompt. Why: avoid anonymous scraping of user content.
- Offline caching uses vite-plugin-pwa generateSW, registered only via src/lib/pwa.ts with preview/dev guards. Why: service workers must never run in previews.
- Messaging state lives in a provider inside StoreProvider, with effect-scoped realtime channels; database grants limit recipients to read receipts and keep conversation participants immutable to protect private chats.
- Stories use a dedicated viewer and shared expiry rules; a database trigger enforces the lifetime so clients cannot extend it.
- Profile presentation uses shared loading/join/member/missing state rules before rendering user data, so cached profiles cannot appear to signed-out visitors.
- Friendship state lives in StoreProvider with effect-scoped realtime reloads; shared rules gate cached posts/stories and database policies gate reads, interactions and photo signing. Why: pending or removed friendships must never unlock private content.
- Private profiles keep member-visible identity for friend requests, but their posts, stories and interactions require ownership or an accepted friendship; only receivers can accept and participants cannot change friendship identities. Why: enforce privacy independently of the UI.
- Reels use a dedicated private video bucket and owner/friend-aware read policies for videos and interactions; reusable sounds reference accessible original Reels and rank by local likes, not an external music catalogue. Why: preserve member privacy and avoid unlicensed music or fake trends.
