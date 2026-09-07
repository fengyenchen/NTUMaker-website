import { courseInfo, courseTracks, type CourseTrack } from "@/data/course-schedule";

type ApiResource = {
  title: string;
  visibility: "public" | "member";
};

type ApiSession = {
  title: string;
  week_label: string;
  summary: string;
  order_index: number;
  starts_at: string;
  resources: ApiResource[];
};

type ApiCourseSeries = {
  title: string;
  track: string;
  time: string;
  description: string;
  sessions: ApiSession[];
};

export async function getCourseTracks(): Promise<CourseTrack[]> {
  const apiUrl = (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");
  try {
    const response = await fetch(`${apiUrl}/api/v1/content/course-library`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return courseTracks;
    const data = (await response.json()) as ApiCourseSeries[];
    if (!data.length) return courseTracks;
    return data
      .map((series): CourseTrack => ({
        id: series.track,
        day: trackDayLabel(series.track),
        time: series.time,
        title: series.title,
        description: series.description,
        sessions: [...series.sessions]
          .sort((a, b) => a.order_index - b.order_index)
          .map((session) => ({
            week: session.week_label,
            title: session.title,
            summary: session.summary,
            assets: session.resources.map((resource) => resource.title),
            isPublic: session.resources.some((resource) => resource.visibility === "public"),
            startsAt: session.starts_at,
          })),
      }))
      .sort((a, b) => dayOrder(a.id) - dayOrder(b.id));
  } catch {
    return courseTracks;
  }
}

function trackDayLabel(track: string) {
  return ({ monday: "星期一", tuesday: "星期二", wednesday: "星期三", thursday: "星期四", friday: "星期五", saturday: "星期六", sunday: "星期日" } as Record<string, string>)[track] ?? track;
}

function dayOrder(track: string) {
  return ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].indexOf(track);
}
