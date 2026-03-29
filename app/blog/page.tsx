import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { blogPosts, formatBlogDate } from "./data";

export const metadata: Metadata = {
  title: "Fixflow Blog",
  description:
    "Insights from the Fixflow team on Tally connectivity, financial operations, AI reliability, and growth execution.",
};

const featuredPost = blogPosts.find((post) => post.featured) ?? blogPosts[0];
const recentPosts = blogPosts.filter((post) => post.slug !== featuredPost.slug);
const tags = Array.from(new Set(blogPosts.map((post) => post.tag)));

export default function BlogPage() {
  return (
    <main style={{ background: "#0a1a0f", minHeight: "100vh", color: "#e8f5e9" }}>
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(10,26,15,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(74,222,128,0.12)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-75"
          style={{ color: "#4ade80" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Fixflow
        </Link>

        <Link
          href="/sign-up"
          className="rounded-full px-5 py-2 text-sm font-bold text-black transition hover:opacity-90"
          style={{ background: "#4ade80" }}
        >
          Get started
        </Link>
      </nav>

      <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-14">
        <header className="max-w-3xl">
          <p
            className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "#4ade80" }}
          >
            Blog
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">
            Finance, AI, and operations insights for growth-stage teams
          </h1>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "#90b59c" }}>
            Practical writing from the Fixflow team on building reliable financial workflows with Tally and AI.
          </p>
        </header>

        <section className="mt-8 flex flex-wrap gap-2">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              color: "#d8f7e1",
              border: "1px solid rgba(74,222,128,0.28)",
              background: "rgba(74,222,128,0.1)",
            }}
          >
            All
          </span>
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                color: "#aed7ba",
                border: "1px solid rgba(74,222,128,0.16)",
                background: "rgba(74,222,128,0.04)",
              }}
            >
              {tag}
            </span>
          ))}
        </section>

        <section className="mt-10">
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="group block rounded-3xl p-8 transition-all"
            style={{
              border: "1px solid rgba(74,222,128,0.18)",
              background:
                "linear-gradient(135deg, rgba(74,222,128,0.12) 0%, rgba(74,222,128,0.04) 60%, rgba(0,0,0,0.2) 100%)",
            }}
          >
            <p
              className="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
              style={{ color: "#4ade80", background: "rgba(74,222,128,0.14)" }}
            >
              Featured
            </p>
            <h2 className="mt-4 text-2xl font-black leading-snug text-white md:text-3xl">
              {featuredPost.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed" style={{ color: "#9cc4a9" }}>
              {featuredPost.description}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs" style={{ color: "#8ab095" }}>
              <span>{featuredPost.tag}</span>
              <span>•</span>
              <span>{formatBlogDate(featuredPost.publishedAt)}</span>
              <span>•</span>
              <span>{featuredPost.readTime}</span>
              <span>•</span>
              <span>{featuredPost.author}</span>
            </div>

            <p
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold transition group-hover:gap-2.5"
              style={{ color: "#4ade80" }}
            >
              Read article
              <ArrowRight className="h-4 w-4" />
            </p>
          </Link>
        </section>

        <section className="mt-12">
          <h3 className="text-lg font-bold text-white">Recent articles</h3>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {recentPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl p-6 transition"
                style={{
                  border: "1px solid rgba(74,222,128,0.12)",
                  background: "rgba(74,222,128,0.04)",
                }}
              >
                <div className="mb-3 flex items-center gap-2 text-xs" style={{ color: "#89ad94" }}>
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{formatBlogDate(post.publishedAt)}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <p className="text-lg font-bold leading-snug text-white transition-colors group-hover:text-[#4ade80]">
                  {post.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#8fb49b" }}>
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs" style={{ color: "#80a78c" }}>
                  <span>{post.tag}</span>
                  <span className="inline-flex items-center gap-1 text-[#4ade80]">
                    Read
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section
          className="mt-14 rounded-2xl p-8 text-center"
          style={{
            border: "1px solid rgba(74,222,128,0.14)",
            background: "rgba(74,222,128,0.05)",
          }}
        >
          <p className="text-xl font-bold text-white">Get product and finance updates from Fixflow</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed" style={{ color: "#8eb39a" }}>
            We share practical articles for operators and finance teams building with Tally and AI-enabled workflows.
          </p>
          <a
            href="mailto:info@fixflowtally.com?subject=Subscribe to Fixflow blog updates"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-black transition hover:opacity-90"
            style={{ background: "#4ade80" }}
          >
            Subscribe to updates
            <ArrowRight className="h-4 w-4" />
          </a>
        </section>
      </div>
    </main>
  );
}
