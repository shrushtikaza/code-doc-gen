import express from "express";
import dotenv from "dotenv";
import { fetchRepoContents } from "./githubFetcher.js";
import { generateDocumentation } from "./docGenerator.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.post("/generate", async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({
        success: false,
        error: "repoUrl is required",
      });
    }

    console.log("Fetching repository contents...");
    const { repoName, files } = await fetchRepoContents(
      repoUrl,
      process.env.GITHUB_TOKEN
    );

    console.log(`Found ${files.length} files. Generating documentation...`);
    const documentation = await generateDocumentation(
      repoName,
      files,
      process.env.GEMINI_API_KEY
    );

    res.json({ success: true, documentation });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
