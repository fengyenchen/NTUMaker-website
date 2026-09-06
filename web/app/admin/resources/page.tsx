import { redirect } from "next/navigation";

export default function ResourcesAdminRedirect() {
  redirect("/admin/courses");
}
