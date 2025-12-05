import { JobExplorer } from "@/components/JobExplorer";
import { getJobStats, getJobs } from "@/lib/jobs";

export default function Home() {
  const jobs = getJobs();
  const stats = getJobStats(jobs);
  const profile = {
    name: "Marwen Slimen",
    experience: "1.5+ years in digital marketing and creative production",
    location: "Tunisia (open to relocation)",
    skills: [
      "Digital marketing",
      "Content creation",
      "Social media management",
      "Videography & video editing",
      "Graphic design",
      "WordPress",
      "SEO basics",
    ],
    preferences: [
      "Marketing Assistant / Digital Marketing Executive",
      "Content Creator / Content Specialist",
      "Social Media Manager",
      "Videographer / Video Editor",
      "WordPress Content Manager",
      "Creative Assistant",
    ],
    portfolio: undefined,
  };
  const visaSupportRate = stats.total
    ? Math.round((stats.visaMentioned / stats.total) * 100)
    : 0;
  const lastUpdated = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-16 sm:px-8 lg:px-10">
        <header className="space-y-8">
          <div className="space-y-4 text-balance">
            <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1 text-xs font-medium uppercase tracking-wide text-emerald-200">
              Visa-smart marketing radar
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
              Fresh employer-ready roles aligned with Marwen’s creative marketing toolkit.
            </h1>
            <p className="max-w-3xl text-lg text-slate-300">
              Prioritised for UK, Netherlands, Belgium, Ireland, and Italy with a focus on employers open to relocation or
              sponsorship. Filters below let you zero-in on each market, role family, or visa signal in seconds.
            </p>
            <p className="text-sm text-slate-400">Last refreshed: {lastUpdated}</p>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Open roles tracked" value={stats.total.toString()} description="Actively hiring across target countries." />
            <MetricCard
              label="Visa mentions"
              value={`${stats.visaMentioned}`}
              description={`${visaSupportRate}% of tracked postings reference relocation or visa help.`}
            />
            <MetricCard
              label="Markets covered"
              value={`${stats.countries.length}`}
              description={stats.countries.join(" · ")}
            />
            <MetricCard
              label="Role families"
              value={`${stats.jobTypes.length}`}
              description="All mapped to Marwen’s experience."
            />
          </dl>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-100">Fast-track playbook</h2>
            <ul className="mt-3 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
              <li className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <span className="font-semibold text-emerald-200">Reach out in 48 hours:</span> short-list the visa-noted roles first
                and send tailored outreach referencing relocation availability.
              </li>
              <li className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <span className="font-semibold text-emerald-200">Portfolio ready:</span> keep your best video edits, campaign
                analytics, and WordPress builds linked for quick submission.
              </li>
              <li className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <span className="font-semibold text-emerald-200">Sponsorship script:</span> explain relocation timeline, Tunisian base,
                and ability to move quickly once sponsorship is confirmed.
              </li>
              <li className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <span className="font-semibold text-emerald-200">Network effect:</span> message hiring managers on LinkedIn before
                applying to flag your cross-border experience.
              </li>
            </ul>
          </div>
        </header>

        <JobExplorer jobs={jobs} countries={stats.countries} jobTypes={stats.jobTypes} profile={profile} />
      </div>
    </div>
  );
}

type MetricCardProps = {
  value: string;
  label: string;
  description: string;
};

function MetricCard({ value, label, description }: MetricCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-lg shadow-emerald-500/5">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-2 text-3xl font-semibold text-white">{value}</dd>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </div>
  );
}
