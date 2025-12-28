import fs from "node:fs/promises";

async function importIdeas() {
  try {
    // Prefer the combined export if present
    let payload = null;

    try {
      const combined = JSON.parse(await fs.readFile("export.json", "utf8"));
      payload = combined;
    } catch (_) {
      // fallback to separate files
      const ideas = JSON.parse(
        await fs.readFile("backend/ideas-export.json", "utf8")
      );
      let posts = [];
      try {
        posts = JSON.parse(
          await fs.readFile("backend/scheduled-posts-export.json", "utf8")
        );
      } catch (_) {
        // ignore
      }
      payload = { ideas, scheduledPosts: posts };
    }

    // Force replace mode
    payload.mode = "replace";

    console.log("Posting payload to /import (replace mode)");
    const res = await fetch("http://localhost:3001/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("Import failed", res.status, text);
      process.exitCode = 2;
      return;
    }

    try {
      console.log("Import successful", JSON.parse(text));
    } catch (_) {
      console.log("Import successful", text);
    }
  } catch (err) {
    console.error("Failed to import ideas", err);
    process.exitCode = 1;
  }
}

importIdeas();
