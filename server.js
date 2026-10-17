require("dotenv").config();
const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const port = Number(process.env.PORT || 3000);
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(client) });
});

app.post("/api/ask", async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({
        error: "AI is not configured yet. Copy .env.example to .env and add your OpenAI API key."
      });
    }
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message) return res.status(400).json({ error: "Please ask a question." });
    if (message.length > 8000) return res.status(413).json({ error: "Please keep questions under 8,000 characters." });

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: [
        "You are Nova, a helpful, friendly voice-first AI assistant.",
        "Answer clearly and naturally, as if speaking aloud. Use concise paragraphs and avoid excessive markdown.",
        "For questions about current events, recent facts, or information that may have changed, use web search.",
        "Be honest about uncertainty. Never claim you searched if you did not.",
        "When useful, include the most relevant sources from web search in the answer."
      ].join(" "),
      tools: [{ type: "web_search" }],
      input: message
    });

    const answer = response.output_text || "Sorry, I couldn't produce a response.";
    const sourceMap = new Map();
    for (const item of (response.output || [])) {
      if (item.type !== "message" || !Array.isArray(item.content)) continue;
      for (const content of item.content) {
        for (const annotation of (content.annotations || [])) {
          if (annotation.type === "url_citation" && annotation.url) {
            sourceMap.set(annotation.url, {
              title: annotation.title || new URL(annotation.url).hostname,
              url: annotation.url
            });
          }
        }
      }
    }
    res.json({ answer, sources: [...sourceMap.values()].slice(0, 8) });
  } catch (error) {
    console.error("AI request failed:", error?.message || error);
    const status = error?.status === 401 ? 401 : 500;
    res.status(status).json({
      error: status === 401
        ? "The API key was rejected. Check OPENAI_API_KEY in your .env file."
        : "The AI request failed. Check your API access, model setting, internet connection, and server terminal."
    });
  }
});

app.listen(port, () => {
  console.log(`Nova is running at http://localhost:${port}`);
  if (!client) console.log("Add OPENAI_API_KEY to .env to enable AI responses.");
});
