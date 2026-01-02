import { Octokit } from "octokit";

export async function fetchRepoContents(repoUrl, githubToken) {
  if (!githubToken) {
    throw new Error("GitHub token is required");
  }

  const octokit = new Octokit({ auth: githubToken });

  // Parse GitHub URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }

  const [, owner, repo] = match;

  // 1️⃣ Get repo details (to find default branch SHA)
  const { data: repoData } = await octokit.rest.repos.get({
    owner,
    repo,
  });

  // 2️⃣ Get the commit SHA of the default branch
  const { data: branchData } = await octokit.rest.repos.getBranch({
    owner,
    repo,
    branch: repoData.default_branch,
  });

  const treeSha = branchData.commit.sha;

  // 3️⃣ Fetch full recursive tree
  const { data: tree } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: "true",
  });

  // 4️⃣ Filter code files
  const codeFiles = tree.tree.filter(
    (item) =>
      item.type === "blob" &&
      /\.(js|py|java|cpp|ts|jsx|tsx|go|rs|rb)$/i.test(item.path)
  );

  // 5️⃣ Fetch file contents (limit to 50)
  const files = await Promise.all(
    codeFiles.slice(0, 50).map(async (file) => {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: file.path,
      });

      // Skip non-text files safely
      if (Array.isArray(data) || !data.content) return null;

      return {
        path: file.path,
        content: Buffer.from(data.content, "base64").toString("utf-8"),
      };
    })
  );

  return {
    repoName: repo,
    owner,
    fileCount: files.filter(Boolean).length,
    files: files.filter(Boolean),
  };
}
