"use client";

import { useMemo, useState } from "react";
import type { Job, VisaStatus } from "@/lib/jobs";

type JobExplorerProps = {
  jobs: Job[];
  countries: string[];
  jobTypes: string[];
  profile: {
    name: string;
    experience: string;
    location: string;
    skills: string[];
    preferences: string[];
    portfolio?: string;
  };
};

const visaStatusOptions: VisaStatus[] = ["Mentioned", "Not mentioned"];

const visaStatusStyles: Record<VisaStatus, string> = {
  Mentioned: "bg-emerald-500/10 text-emerald-300 border-emerald-300/40",
  "Not mentioned": "bg-amber-500/10 text-amber-200 border-amber-300/30",
};

export function JobExplorer({ jobs, countries, jobTypes, profile }: JobExplorerProps) {
  const [country, setCountry] = useState<string>("All");
  const [jobType, setJobType] = useState<string>("All");
  const [visaStatus, setVisaStatus] = useState<VisaStatus | "All">("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (country !== "All" && job.country !== country) return false;
      if (jobType !== "All" && job.jobType !== jobType) return false;
      if (visaStatus !== "All" && job.visaStatus !== visaStatus) return false;
      if (searchTerm.trim()) {
        const haystack = `${job.title} ${job.company} ${job.reason}`.toLowerCase();
        if (!haystack.includes(searchTerm.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [jobs, country, jobType, visaStatus, searchTerm]);

  const priorityJobs = filteredJobs.filter((job) => job.visaStatus === "Mentioned");
  const otherJobs = filteredJobs.filter((job) => job.visaStatus !== "Mentioned");

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold text-slate-100">Tailor Your Search</h2>
        <p className="mt-1 text-sm text-slate-300">
          {profile.name} &ndash; {profile.experience}. Currently in {profile.location}.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm text-slate-200">
            Country
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            >
              <option value="All">All target markets</option>
              {countries.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-200">
            Role focus
            <select
              value={jobType}
              onChange={(event) => setJobType(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            >
              <option value="All">Any role that matches</option>
              {jobTypes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-200">
            Visa highlight
            <select
              value={visaStatus}
              onChange={(event) =>
                setVisaStatus(event.target.value === "All" ? "All" : (event.target.value as VisaStatus))
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            >
              <option value="All">All visa statuses</option>
              {visaStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-200">
            Keyword
            <input
              type="search"
              placeholder="Search company, role, or skill"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="space-y-4">
            <header className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold text-emerald-200">
                Visa-forward matches ({priorityJobs.length})
              </h3>
              <span className="text-sm text-slate-300">
                {priorityJobs.length
                  ? "Applications that explicitly mention relocation or visa support."
                  : "No explicit visa mentions under the current filters."}
              </span>
            </header>
            <div className="grid gap-4">
              {priorityJobs.length ? (
                priorityJobs.map((job) => <JobCard key={job.link} job={job} priority />)
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-300">
                  Try widening the country or keyword filters to uncover additional visa-friendly roles.
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <header className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold text-slate-100">
                All matched opportunities ({filteredJobs.length})
              </h3>
              <span className="text-xs uppercase tracking-wide text-slate-400">
                Sorted by visa visibility, country, and company
              </span>
            </header>
            <div className="grid gap-4">
              {otherJobs.length ? (
                otherJobs.map((job) => <JobCard key={job.link} job={job} />)
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-300">
                  All visible results already surfaced above.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h3 className="text-base font-semibold text-slate-100">Profile signal booster</h3>
          <p className="mt-2 text-sm text-slate-300">
            Keep these points handy when tailoring cover letters and intros.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            <li className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <strong className="text-emerald-200">Core skills:</strong>{" "}
              {profile.skills.join(" · ")}
            </li>
            <li className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <strong className="text-emerald-200">Target roles:</strong>{" "}
              {profile.preferences.join(" · ")}
            </li>
            {profile.portfolio ? (
              <li className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3">
                <strong className="text-emerald-200">Portfolio:</strong>{" "}
                <a
                  href={profile.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-emerald-400/60 underline-offset-4 transition hover:text-emerald-100"
                >
                  {profile.portfolio}
                </a>
              </li>
            ) : null}
          </ul>
          <p className="mt-6 text-xs text-slate-400">
            Tip: highlight visa sponsorship needs early &mdash; most recruiters in these markets ask within the
            first screen.
          </p>
        </aside>
      </div>
    </section>
  );
}

type JobCardProps = {
  job: Job;
  priority?: boolean;
};

function JobCard({ job, priority = false }: JobCardProps) {
  return (
    <article
      className={`rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-emerald-500/5 transition hover:border-emerald-400/40 hover:shadow-emerald-400/20 ${
        priority ? "ring-1 ring-emerald-400/40" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-slate-100">{job.title}</h4>
          <p className="text-sm text-slate-300">
            {job.company} &middot; {job.location}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${visaStatusStyles[job.visaStatus]}`}
        >
          {job.visaStatus === "Mentioned" ? "Visa / relocation noted" : "Visa not mentioned"}
        </span>
      </div>

      <dl className="mt-4 space-y-2 text-sm text-slate-200">
        <div className="flex flex-wrap gap-2">
          <dt className="font-semibold text-emerald-200">Role fit:</dt>
          <dd>{job.jobType}</dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="font-semibold text-emerald-200">Why you match:</dt>
          <dd>{job.reason}</dd>
        </div>
        {job.visaSnippet ? (
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold text-emerald-200">Sponsor note:</dt>
            <dd className="text-slate-100">{job.visaSnippet}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
        <a
          href={job.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-emerald-300"
        >
          Apply on {job.source}
        </a>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {job.country}
        </span>
      </div>
    </article>
  );
}
