export default function Home() {
  const linkedInUrl = "https://www.linkedin.com/in/sonya-ling";
  const githubUrl = "https://github.com/threecuptea";
  const futurePortfolioUrl = "https://example.com/portfolio";

  const careerMilestones = [
    {
      period: "2023 - 2025",
      role: "Staff Software Engineer, OpenX",
      impact:
        "Led end-to-end Lookalike pipeline architecture, connecting TypeScript APIs, GraphQL, and Python ML workloads on GCP.",
    },
    {
      period: "2019 - 2023",
      role: "Senior Software Engineer, OpenX",
      impact:
        "Built identity and audience activation systems at scale, integrating distributed data pipelines and reporting infrastructure.",
    },
    {
      period: "2018 - 2019",
      role: "Staff Software Engineer, TiVo",
      impact:
        "Modernized event-driven data interfaces with Kafka and strengthened throughput, partition strategy, and reliability.",
    },
    {
      period: "2017 - 2018",
      role: "Principal Software Engineer, Rovi",
      impact:
        "Resolved critical memory and runtime constraints in backend data services through deep profiling and JVM tuning.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(129,140,248,0.16),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(244,114,182,0.14),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 pb-16 pt-8 sm:px-10 lg:px-14">
        <header className="sticky top-4 z-10 rounded-full border border-white/15 bg-slate-900/70 px-6 py-3 backdrop-blur-xl">
          <nav className="flex items-center justify-between text-sm">
            <span className="font-semibold tracking-[0.16em] text-cyan-300">
              SONYA LING
            </span>
            <div className="flex items-center gap-5 text-slate-300">
              <a href="#about" className="transition hover:text-white">
                About
              </a>
              <a href="#journey" className="transition hover:text-white">
                Career Journey
              </a>
              <a href="#portfolio" className="transition hover:text-white">
                Portfolio
              </a>
            </div>
          </nav>
        </header>

        <section className="grid gap-8 rounded-3xl border border-white/10 bg-slate-900/55 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl lg:grid-cols-[1.5fr_1fr] lg:p-12">
          <div className="space-y-6">
            <p className="inline-block rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
              Staff Software Engineer
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
              Enterprise impact.
              <br />
              Edgy execution.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
              I build resilient data platforms, high-volume distributed systems,
              and AI-enabled products from concept to production. With 13+ years
              in AdTech and cloud engineering, I deliver strategy-level clarity
              and hands-on technical depth.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#journey"
                className="rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
              >
                Explore Career Journey
              </a>
              <a
                href="#portfolio"
                className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200"
              >
                View Portfolio Placeholder
              </a>
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-6">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-cyan-400/20 blur-2xl" />
            <div className="relative space-y-5">
              <div className="h-14 w-14 rounded-full border border-white/20 bg-slate-800/80 text-center text-xl font-semibold leading-[3.5rem] text-cyan-200">
                SL
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">At a glance</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Data pipelines, distributed systems, ML platform integration,
                  and cloud-native architecture.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-slate-200">
                <li>13+ years engineering experience</li>
                <li>Technical leadership across cross-functional teams</li>
                <li>Production ownership from ideation to deployment</li>
              </ul>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Experience
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">13+ yrs</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Core Domain
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">AdTech</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Stack Depth
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">Data + ML</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Delivery
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">E2E Owner</p>
          </article>
        </section>

        <section id="about" className="grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-slate-900/55 p-7 backdrop-blur-xl md:col-span-2">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              About Me
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              Engineering with precision, velocity, and ownership
            </h2>
            <p className="mt-4 leading-relaxed text-slate-300">
              I specialize in architecting robust backend and data systems where
              reliability and scale are non-negotiable. From tuning BigQuery
              workloads to designing event-driven services and ML pipelines, I
              focus on outcomes that are measurable, maintainable, and aligned
              with business goals.
            </p>
            <p className="mt-4 leading-relaxed text-slate-300">
              My toolkit spans Python, Java, TypeScript, Go, Kafka, Spark,
              Airflow, GraphQL, and cloud platforms including GCP, AWS, and
              Azure. I blend enterprise discipline with a builder mindset to
              ship fast without sacrificing engineering quality.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-slate-900/55 p-7 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              Focus Areas
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li>High-throughput distributed systems</li>
              <li>AI/ML and agentic workflow integration</li>
              <li>Data platform modernization</li>
              <li>Cloud-native architecture and CI/CD</li>
              <li>Cross-functional technical leadership</li>
            </ul>
          </article>
        </section>

        <section id="journey" className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              Career Journey
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              Building systems that scale with ambition
            </h2>
          </div>
          <div className="grid gap-4">
            {careerMilestones.map((milestone) => (
              <article
                key={`${milestone.period}-${milestone.role}`}
                className="group rounded-2xl border border-white/10 bg-slate-900/45 p-6 transition hover:border-cyan-300/40 hover:bg-slate-900/70"
              >
                <p className="text-sm font-medium text-cyan-300">
                  {milestone.period}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  {milestone.role}
                </h3>
                <p className="mt-3 leading-relaxed text-slate-300">
                  {milestone.impact}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="portfolio"
          className="rounded-3xl border border-cyan-300/25 bg-gradient-to-r from-slate-900 to-slate-800 p-8 shadow-xl shadow-cyan-950/40 md:p-10"
        >
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            Portfolio
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            Portfolio showcase coming soon
          </h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-slate-300">
            This section is intentionally reserved for selected case studies and
            project deep dives. Link this button to your future portfolio when
            you are ready.
          </p>
          <div className="mt-6">
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200"
            >
              LinkedIn Profile
            </a>
            <a
              href={futurePortfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 inline-flex rounded-full border border-cyan-300/40 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
            >
              Future Portfolio Link
            </a>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 inline-flex rounded-full border border-indigo-300/40 px-5 py-2.5 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-300/10"
            >
              GitHub
            </a>
          </div>
        </section>

        <footer className="pb-4 text-sm text-slate-400">
          Built with Next.js. Designed for a modern, executive-tech personal
          brand. Contact:{" "}
          <a
            className="text-cyan-200 transition hover:text-cyan-100"
            href="mailto:sonya_ling1947@yahoo.com"
          >
            sonya_ling1947@yahoo.com
          </a>
        </footer>
      </main>
    </div>
  );
}
