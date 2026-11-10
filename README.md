## Getting Started

This repo uses [pnpm](https://pnpm.io) (version pinned in `package.json`'s `packageManager` field). Install dependencies and run the development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# dsc-speed-dataing

## Conversation starters

When an admin runs matching, the server generates two shared conversation starters
per selected pair with Anthropic and stores them in `curr_matches.conversation_starters`
(JSONB). Both participants see the same saved items on `/match`; viewing or refreshing
a match never calls Anthropic. Starters are generated for new matches only, and are
not archived in `previous_matches`.

Set these server-side environment variables in the root `.env` and in your deployment:

```dotenv
LLM_API_KEY=<your Anthropic API key>
# Optional model override; the default is claude-haiku-4-5-20251001.
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

Do not prefix the LLM key with `NEXT_PUBLIC_` or commit it. If the column has not
already been added, run `scripts/curr_matches.sql` in the Supabase SQL editor; its
column addition is safe to rerun.

Only relevant survey fields are sent to Anthropic, with multiple-choice answers
decoded to text. Emails, names, social links, pronouns, matching preferences, and
embeddings are excluded. Responses must contain exactly two distinct, nonempty
items of at most 240 characters each. Missing credentials, unavailable profiles,
API failures, and invalid output fall back to two generic questions. Old matches
without saved starters also display generic questions.

Generation uses at most four concurrent requests, a 12-second request timeout,
one SDK retry, and a shared 45-second deadline for loading profiles and generating
the round's starters. Pairs left when that deadline expires receive fallback
questions. The matching route requests a 120-second function duration; verify
that your hosting plan supports it and that embedding generation, this deadline,
and database writes fit within it. Larger events may need a durable background job.

The Anthropic generator does not require `OPENAI_API_KEY`. The existing matching
algorithm still requires it when participants lack cached OpenAI embeddings.

Run `pnpm test` for mocked Anthropic/Supabase checks, including validation,
fallbacks, profile filtering, concurrency, and operation without an OpenAI key.
These tests do not use real credentials or call live services.
