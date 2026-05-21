import { OpenInAppPage } from "@/components/open-in-app-page";

export default async function AutoSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OpenInAppPage type="auto" id={id} title="Auto Driver" />;
}
