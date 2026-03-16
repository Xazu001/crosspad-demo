import { useLoaderData } from "react-router";

import { Badge } from "#/components/ui/badge";

import blogStyles from "./blog.style.scss?url";

// ──────────────────────────────────────────────────────────────

export const links = () => [
  {
    rel: "preload",
    href: blogStyles,
    as: "style",
  },
  {
    rel: "stylesheet",
    href: blogStyles,
    precedence: "high",
  },
];

interface BlogMeta {
  slug: string;
  title: string;
  date: string;
  author: string;
  image?: string;
  excerpt: string;
  file: string;
}

interface BlogPost extends Omit<BlogMeta, "file"> {
  content: string;
}

interface BlogLoaderData {
  posts: BlogPost[];
}

// ──────────────────────────────────────────────────────────────

/** Parse markdown content into structured data */
function parseMarkdownContent(markdown: string): string {
  // For now, just return the raw markdown
  // In the future, we could add more sophisticated parsing
  return markdown;
}

// Uses Cloudflare ASSETS binding to fetch static files without circular requests
export async function loader({
  request,
  context,
}: {
  request: Request;
  context: any;
}): Promise<BlogLoaderData> {
  const assets = context.cloudflare.ASSETS;
  const basePath = "/data/blog";

  const indexRes = await assets.fetch(new URL(`${basePath}/index.json`, request.url));
  if (!indexRes.ok) {
    throw new Error("Failed to fetch blog index");
  }
  const manifest: BlogMeta[] = await indexRes.json();

  const posts: BlogPost[] = await Promise.all(
    manifest.map(async ({ file, ...meta }) => {
      const mdRes = await assets.fetch(new URL(`${basePath}/${file}`, request.url));
      if (!mdRes.ok) {
        throw new Error(`Failed to fetch blog post: ${file}`);
      }
      const markdown = await mdRes.text();
      const content = parseMarkdownContent(markdown);

      return { ...meta, content };
    }),
  );

  return { posts };
}

// ──────────────────────────────────────────────────────────────

export default function Blog() {
  const { posts } = useLoaderData<BlogLoaderData>();

  return (
    <main className="blog">
      <div className="blog__container">
        <div className="blog__header">
          <h1 className="blog__title">Blog</h1>
          <p className="blog__subtitle">
            Latest news, updates, and insights from the Crosspad team.
          </p>
        </div>

        <div className="blog__grid">
          {posts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </main>
  );
}

const BlogPostCard = ({ post }: { post: BlogPost }) => {
  return (
    <article className="blog-card">
      {post.image && (
        <div className="blog-card__image">
          <img src={post.image} alt={post.title} />
        </div>
      )}

      <div className="blog-card__content">
        <div className="blog-card__meta">
          <Badge variant="card" size="sm">
            {post.date}
          </Badge>
          <span className="blog-card__author">{post.author}</span>
        </div>

        <h2 className="blog-card__title">{post.title}</h2>
        <p className="blog-card__excerpt">{post.excerpt}</p>

        <a href={`/blog/${post.slug}`} className="blog-card__link">
          Read more
        </a>
      </div>
    </article>
  );
};
