# TheoHub v0.2 — Full-stack starter

TheoHub is a khaki-themed SDA theology study app starter with sermon discovery, 28 belief summaries, a TheoAI interface, account sign-in, and private saved work.

## What is and isn't live yet
- The frontend is included in `public/`.
- The AI endpoint uses the OpenAI Responses API and keeps the API key on the server.
- Supabase Auth handles email/password sign-up and sign-in.
- Saved work uses a Supabase table protected by Row Level Security (RLS).
- You must create your own service projects and add credentials before the live features work. No API keys are included.
- Android project files are generated locally by Capacitor; this zip is not a signed APK and not a Play Store release.

## Requirements
Node.js 22+ is recommended for current Capacitor tooling. Install Android Studio and the Android SDK to build the Android version.

## 1. Set up Supabase
1. Create a Supabase project at https://supabase.com/.
2. In Project Settings / API, copy the project URL and publishable key. Put those values in `public/config.js`. This browser file may contain only the publishable key, never a service-role key.
3. Open the SQL Editor and run `supabase-schema.sql`. This creates `saved_work` and policies that limit each user to their own rows.
4. In Authentication settings, configure email confirmation and the site URL for your eventual deployment domain.

## 2. Configure the backend
1. Copy `.env.example` to `.env`.
2. Add your OpenAI API key to `OPENAI_API_KEY`; choose a model available to your API project in `OPENAI_MODEL`. Keep `.env` private and out of source control.
3. Add the Supabase project URL and publishable key to `.env` too.
4. Install and run:
   ```sh
   npm install
   npm start
   ```
5. Visit http://localhost:3000. Check http://localhost:3000/api/health to see which services are configured.

## 3. Android build
Capacitor requires a package.json, a web assets directory with index.html, and a Capacitor config. This project is preconfigured with `public/` as the web directory.

```sh
npm install
npx cap add android
npx cap sync android
npx cap open android
```

Use Android Studio to test on a device or emulator. For an APK/AAB release, configure your app signing, application ID, privacy policy, and store listing. Do not ship a production app until account recovery, privacy, error handling, and source content are tested.

## 4. Deploy web + API
Deploy the Node app to a host that supports a persistent Node.js server or suitable server functions, and set the environment variables in the host dashboard. Serve over HTTPS. Configure Supabase Auth's allowed redirect/site URLs to your deployed domain. A static-only host cannot run `server.js` by itself; the frontend and API must both be hosted.

## Important security notes
- Never place `OPENAI_API_KEY` or a Supabase service-role key in `public/`, mobile app code, or client JavaScript.
- Set usage limits and billing alerts for your AI provider. Rate limiting here is a basic starting point, not complete abuse protection.
- Review generated sermons and theological answers against Scripture and primary sources. AI may produce mistakes or inaccurate references.
- Use only research materials you have permission to publish or link to; verify authorship and bibliographic details.

## Helpful official documentation
- OpenAI API: https://platform.openai.com/docs/
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Capacitor: https://capacitorjs.com/docs/getting-started
