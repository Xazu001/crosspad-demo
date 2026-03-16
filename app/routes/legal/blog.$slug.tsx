import { useLoaderData } from "react-router";

import { Badge } from "#/components/ui/badge";

// ──────────────────────────────────────────────────────────────

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  image?: string;
  excerpt: string;
  content: string;
}

interface BlogPostLoaderData {
  post: BlogPost;
}

// ──────────────────────────────────────────────────────────────

/** Parse markdown content into structured sections with items */
function parseMarkdownSections(markdown: string): {
  title: string;
  sections: {
    title?: string;
    content: string[];
    type: "paragraph" | "list";
  }[];
} {
  const sections: {
    title?: string;
    content: string[];
    type: "paragraph" | "list";
  }[] = [];

  let currentSection: {
    title?: string;
    content: string[];
    type: "paragraph" | "list";
  } = { content: [], type: "paragraph" };

  let title = "";

  for (const line of markdown.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      title = trimmed.slice(2).trim();
    } else if (trimmed.startsWith("## ")) {
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        title: trimmed.slice(3).trim(),
        content: [],
        type: "paragraph",
      };
    } else if (trimmed.startsWith("- ")) {
      if (currentSection.type !== "list") {
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        currentSection = { content: [], type: "list" };
      }
      currentSection.content.push(trimmed.slice(2).trim());
    } else if (trimmed) {
      if (currentSection.type === "list") {
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        currentSection = { content: [trimmed], type: "paragraph" };
      } else {
        currentSection.content.push(trimmed);
      }
    }
  }

  if (currentSection.content.length > 0) {
    sections.push(currentSection);
  }

  return { title, sections };
}

export async function loader({
  request,
  context,
  params,
}: {
  request: Request;
  context: any;
  params: { slug: string };
}): Promise<BlogPostLoaderData> {
  const { slug } = params;

  if (!slug) {
    throw new Response("Blog post not found", { status: 404 });
  }

  const assets = context.cloudflare.ASSETS;
  const basePath = "/data/blog";

  // First, get the index to find the post
  const indexRes = await assets.fetch(new URL(`${basePath}/index.json`, request.url));
  if (!indexRes.ok) {
    throw new Error("Failed to fetch blog index");
  }
  const manifest = await indexRes.json();

  const postMeta = manifest.find((post: any) => post.slug === slug);
  if (!postMeta) {
    throw new Response("Blog post not found", { status: 404 });
  }

  // Get the actual content
  const mdRes = await assets.fetch(new URL(`${basePath}/${postMeta.file}`, request.url));
  if (!mdRes.ok) {
    throw new Error(`Failed to fetch blog post: ${postMeta.file}`);
  }
  const markdown = await mdRes.text();

  return {
    post: {
      ...postMeta,
      content: markdown,
    },
  };
}

// ──────────────────────────────────────────────────────────────

export default function BlogPost() {
  const { post } = useLoaderData<BlogPostLoaderData>();
  const { title, sections } = parseMarkdownSections(post.content);

  return (
    <main className="blog-post">
      <div className="blog-post__container">
        <div className="blog-post__header">
          <a href="/blog" className="blog-post__back">
            ← Back to Blog
          </a>

          {post.image && (
            <div className="blog-post__image">
              <img src={post.image} alt={post.title} />
            </div>
          )}

          <div className="blog-post__meta">
            <Badge variant="card" size="sm">
              {post.date}
            </Badge>
            <span className="blog-post__author">by {post.author}</span>
          </div>

          <h1 className="blog-post__title">{title}</h1>
          <p className="blog-post__excerpt">{post.excerpt}</p>
        </div>

        <div className="blog-post__content">
          {sections.map((section, i) => (
            <div key={i} className="blog-post__section">
              {section.title && <h2 className="blog-post__section-title">{section.title}</h2>}

              {section.type === "list" ? (
                <ul className="blog-post__list">
                  {section.content.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              ) : (
                <div className="blog-post__paragraphs">
                  {section.content.map((paragraph, j) => (
                    <p key={j}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
