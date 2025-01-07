import BlurFade from "@/components/magicui/blur-fade";
import Link from "next/link";

export const metadata = {
  title: "Blog",
  description: "My thoughts on software development and latest tech.",
};

const BLUR_FADE_DELAY = 0.04;

type PostMetadata = {
  title: string;
  publishedAt: string;
  excerpt: string;
};

type Post = {
  slug: string;
  metadata: PostMetadata;
};

const predefinedPosts: Post[] = [
  {
    slug: "latest-nextjs-features",
    metadata: {
      title: "Exploring the Latest Features in Next.js",
      publishedAt: "2025-01-01",
      excerpt:
        "Next.js continues to evolve with exciting features like App Router, React Server Components, and edge runtimes. Discover what’s new and how to leverage these updates.",
    },
  },
  {
    slug: "typescript-new-features",
    metadata: {
      title: "TypeScript 5.x: New Features and Practical Use Cases",
      publishedAt: "2025-01-05",
      excerpt:
        "TypeScript 5.x brings powerful new features like decorators, improved inference, and expanded utility types. Learn how these updates can streamline your development workflow.",
    },
  },
];

async function getBlogPosts(): Promise<Post[]> {
  const dynamicPosts: Post[] = [];
  return [...predefinedPosts, ...dynamicPosts];
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <BlurFade delay={BLUR_FADE_DELAY}>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tighter mb-4">
            Welcome to My Blog
          </h1>
          <p className="text-muted-foreground text-lg">
            Sharing my thoughts on software development, life, and everything in between.
          </p>
        </div>
      </BlurFade>

      {/* Blog Posts */}
      <div className="space-y-8">
        {posts
          .sort((a, b) => {
            // Convert publishedAt strings to Date objects for comparison
            const dateA = new Date(a.metadata.publishedAt).getTime();
            const dateB = new Date(b.metadata.publishedAt).getTime();
            return dateB - dateA; // Sort by descending order of published date
          })
          .map((post, id) => (
            <BlurFade delay={BLUR_FADE_DELAY * 2 + id * 0.05} key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block p-6 bg-gray-100 dark:bg-gray-800 rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-primary hover:text-primary/80 transition-colors">
                    {post.metadata.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(post.metadata.publishedAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {post.metadata.excerpt || "Read more about this topic."}
                  </p>
                </div>
              </Link>
            </BlurFade>
          ))}
      </div>
    </section>
  );
}
