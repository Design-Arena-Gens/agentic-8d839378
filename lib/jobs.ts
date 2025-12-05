import jobsData from "@/data/jobs.json";

export type VisaStatus = "Mentioned" | "Not mentioned";

export interface Job {
  title: string;
  company: string;
  country: string;
  location: string;
  visaStatus: VisaStatus;
  visaSnippet?: string;
  jobType: string;
  reason: string;
  link: string;
  source: string;
}

interface RawJob {
  title: string;
  company: string;
  country: string;
  location: string;
  visa_status: VisaStatus;
  visa_snippet?: string;
  job_type: string;
  reason: string;
  link: string;
  source: string;
}

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

function cleanSnippet(snippet?: string): string | undefined {
  if (!snippet) return undefined;
  let result = snippet;
  for (const [entity, value] of Object.entries(HTML_ENTITIES)) {
    result = result.split(entity).join(value);
  }
  result = result.replace(/<br\s*\/?>/gi, " ");
  result = result.replace(/<\/?li>/gi, " • ");
  result = result.replace(/<\/?strong>/gi, "");
  result = result.replace(/<\/?em>/gi, "");
  result = result.replace(/<\/?p>/gi, " ");
  result = result.replace(/<\/?ul>/gi, " ");
  result = result.replace(/<\/?[^>]+>/g, " ");
  result = result.replace(/\s+/g, " ").trim();
  if (!result) return undefined;
  return result.length > 220 ? `${result.slice(0, 217).trim()}…` : result;
}

export function getJobs(): Job[] {
  const rawJobs = jobsData as RawJob[];
  const mapped = rawJobs.map<Job>((job) => ({
    title: job.title,
    company: job.company,
    country: job.country,
    location: job.location,
    visaStatus: job.visa_status,
    visaSnippet: cleanSnippet(job.visa_snippet),
    jobType: job.job_type,
    reason: job.reason,
    link: job.link,
    source: job.source,
  }));

  return mapped.sort((a, b) => {
    if (a.visaStatus !== b.visaStatus) {
      return a.visaStatus === "Mentioned" ? -1 : 1;
    }
    if (a.country !== b.country) {
      return a.country.localeCompare(b.country);
    }
    return a.company.localeCompare(b.company);
  });
}

export function getJobStats(jobs: Job[]) {
  const visaMentioned = jobs.filter((job) => job.visaStatus === "Mentioned").length;
  const visaNotMentioned = jobs.length - visaMentioned;
  const countries = Array.from(new Set(jobs.map((job) => job.country))).sort();
  const jobTypes = Array.from(new Set(jobs.map((job) => job.jobType))).sort();

  return {
    total: jobs.length,
    visaMentioned,
    visaNotMentioned,
    countries,
    jobTypes,
  };
}
