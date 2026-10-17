# Nova — AI Voice Assistant

A starter project for a voice-first AI assistant with:
- Browser microphone speech recognition (when supported by the browser)
- Spoken responses using browser text-to-speech
- OpenAI Responses API integration on a backend
- Web search for up-to-date questions
- Source links when the API response includes citations
- Responsive dark sci-fi interface

## Requirements

- Node.js 18 or newer
- An OpenAI API key with API billing/access enabled
- Chrome or Edge recommended for browser speech recognition

## Run it on Windows

1. Extract the ZIP to a folder.
2. Install Node.js LTS from https://nodejs.org/ if you don't already have it.
3. Open the extracted folder in VS Code, or open Command Prompt in that folder.
4. Run `npm install`.
5. Copy `.env.example` and rename the copy to `.env`.
6. Open `.env` and replace `put_your_api_key_here` with your real API key. Do not share the key or upload `.env` to GitHub.
7. Run `npm start`.
8. Open `http://localhost:3000` in Chrome or Edge.
9. Click the microphone and allow access. Speak a question; Nova should answer aloud if Voice is on.

## If it doesn't work

- **API key error:** Confirm `.env` is named exactly `.env`, the key is valid, and your API account has access/billing.
- **Model not found or unavailable:** Change `OPENAI_MODEL` in `.env` to a model available to your API account.
- **Microphone not working:** Use Chrome/Edge, allow microphone permissions for localhost, and check Windows microphone privacy settings. Speech recognition browser support varies and may rely on a network service.
- **Voice output is silent:** Check system volume and browser audio permissions; try the “Speak response” button.
- **Port already in use:** Change `PORT=3000` to another free port in `.env`.

## Important limits

This is a working starter, not an unlimited all-knowing AI. It depends on the configured model, API access, search results, internet connectivity, and usage limits. API calls can cost money. Web search is enabled for questions where it is useful, but no system can guarantee every fact is complete or correct. Browser speech recognition and voices vary by browser and operating system.

The app currently uses English voice recognition (`en-US`). To try another language, change `recognition.lang` in `public/app.js` to a supported BCP-47 language code, such as `bn-BD` if supported by the browser's speech service.

## Before putting it online

Deploy the Node backend to a server that supports environment variables and HTTPS. Set `OPENAI_API_KEY` in the hosting provider's secret/environment settings. Do not place the key in `app.js`, HTML, CSS, a public GitHub repository, or any browser-delivered code. Add authentication and rate limiting before sharing the endpoint publicly, otherwise other people may use your API quota.


## Publish online with GitHub + Render

This project is a full-stack app. GitHub stores your source code; Render runs the Node.js backend and serves the website, so you do not need your PC running.

1. Create a **public GitHub repository** for the project.
2. Upload the contents of this folder to the repository. Upload the files inside this folder, not the ZIP file itself. Make sure `public/`, `server.js`, `package.json`, and `render.yaml` are at the repository root.
3. Do **not** upload your `.env` file or API key. The `.gitignore` file excludes `.env`.
4. Sign in at https://render.com/ and choose **New → Web Service**.
5. Connect your GitHub repository.
6. Use these settings if Render does not fill them from `render.yaml`:
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
7. In the service's **Environment** settings, add `OPENAI_API_KEY` with your private API key. `OPENAI_MODEL` can be `gpt-4.1-mini` if your API account supports it.
8. Deploy and open the public `https://...onrender.com` URL. Test the microphone over HTTPS and allow browser microphone access.

Render's free services may sleep when idle and can take a little time to wake up. Free plan availability and limits can change. API usage is billed separately by the AI provider. See https://render.com/docs/deploy-node-express-app and https://render.com/docs/configure-environment-variables.

**Important:** A public repository makes your source code public, not your API key. Keep the key in Render's Environment settings only. Before sharing widely, add authentication or rate limits so strangers cannot spend your API quota.
