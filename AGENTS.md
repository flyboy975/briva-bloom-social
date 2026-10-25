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
