import { OpenInAppPage } from "@/components/open-in-app-page";

export default async function ServiceSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OpenInAppPage type="service" id={id} title="Service" />;
}
