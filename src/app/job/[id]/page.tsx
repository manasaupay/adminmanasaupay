import { OpenInAppPage } from "@/components/open-in-app-page";

export default async function JobSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OpenInAppPage type="job" id={id} title="Job" />;
}
