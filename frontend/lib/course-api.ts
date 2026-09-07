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
  resources: ApiResource[];
};

type ApiCourseSeries = {
  title: string;
  track: "tuesday" | "friday";
  description: string;
  sessions: ApiSession[];
};

export async function getCourseTracks(): Promise<CourseTrack[]> {
  const apiUrl = (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");
  try {
    const response = await fetch(`${apiUrl}/api/v1/content/course-library`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return courseTracks;
    const data = (await response.json()) as ApiCourseSeries[];
    if (!data.length) return courseTracks;
    return data
      .map((series): CourseTrack => ({
        id: series.track,
        day: series.track === "tuesday" ? "星期二" : "星期五",
        time: courseInfo.time,
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
          })),
      }))
      .sort((a, b) => (a.id === "tuesday" ? -1 : b.id === "tuesday" ? 1 : 0));
  } catch {
    return courseTracks;
  }
}
