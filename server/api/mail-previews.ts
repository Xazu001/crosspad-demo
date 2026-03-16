import { getMailTemplate, mailTemplateKeys } from "$/lib/mail";

import * as React from "react";

import * as ReactDOMServer from "react-dom/server";

import { Hono } from "hono";

const app = new Hono();

// Get all email previews
app.get("/", (c) => {
  const templates = mailTemplateKeys.map((key) => {
    const config = getMailTemplate(key);
    return {
      key,
      name: config.name,
      description: config.description,
      previewUrl: `/api/mail-previews/${key}/html`,
    };
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mail Previews - Crosspad</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a1a; color: #e5e5e5; padding: 2rem; }
        h1 { margin-bottom: 2rem; color: #90db1e; }
        .templates { display: grid; gap: 1rem; }
        .template { background: #2a2a2a; border-radius: 8px; padding: 1.5rem; border: 1px solid #404040; text-decoration: none; display: block; cursor: pointer; transition: border-color 0.2s; }
        .template:hover { border-color: #90db1e; }
        .template h2 { color: #fff; margin-bottom: 0.5rem; }
        .template p { color: #a0a0a0; margin-bottom: 0.5rem; font-size: 0.875rem; }
        .template .preview-hint { color: #90db1e; font-size: 0.75rem; opacity: 0.7; }
      </style>
    </head>
    <body>
      <h1>📬 Mail Previews</h1>
      <div class="templates">
        ${templates
          .map(
            (t) => `
          <a href="${t.previewUrl}" target="_blank" class="template">
            <h2>${t.name}</h2>
            <p>${t.description}</p>
            <span class="preview-hint">Click to preview →</span>
          </a>
        `,
          )
          .join("")}
      </div>
    </body>
    </html>
  `;

  return c.html(html);
});

// Get specific email preview as HTML
app.get("/:mailType/html", (c) => {
  const mailType = c.req.param("mailType") as string;

  if (!mailTemplateKeys.includes(mailType as any)) {
    return c.json({ error: "Email template not found" }, 404);
  }

  const config = getMailTemplate(mailType as any);
  const component = React.createElement(config.component, config.previewProps as any);
  const html = ReactDOMServer.renderToString(component);

  return c.html(html);
});

// Get specific email preview metadata
app.get("/:mailType", (c) => {
  const mailType = c.req.param("mailType") as string;

  if (!mailTemplateKeys.includes(mailType as any)) {
    return c.json({ error: "Email template not found" }, 404);
  }

  const config = getMailTemplate(mailType as any);

  return c.json({
    key: mailType,
    name: config.name,
    description: config.description,
    previewUrl: `/api/mail-previews/${mailType}/html`,
  });
});

export default app;
