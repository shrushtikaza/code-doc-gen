import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateDocumentation(repoName, files, apiKey) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  // Limit content size to avoid token overflow
  const fileSummaries = files
    .map(
      (f) => `
File: ${f.path}
\`\`\`
${f.content.slice(0, 2000)}
\`\`\`
`
    )
    .join("\n");

  const prompt = `
You are a senior technical documentation engineer.

Analyze the GitHub repository "${repoName}" and generate clear, professional documentation.

Repository files:
${fileSummaries}

Create documentation with the following sections:

## Overview
Briefly describe what the project does and its main purpose.

## Architecture
Explain the high-level system design and how components interact.

## Key Components
List important files/modules and explain their responsibilities.

## API Reference
Describe major functions, classes, inputs, and outputs.

## Setup Instructions
Steps to install dependencies and run the project locally.

## Usage Examples
Provide practical examples with code snippets.

Guidelines:
- Use Markdown
- Use clear headings
- Use bullet points where appropriate
- Include code blocks when useful
`;

  const result = await model.generateContent(prompt);

  return result.response.text();
}