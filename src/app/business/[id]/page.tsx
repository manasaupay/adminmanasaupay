import { OpenInAppPage } from "@/components/open-in-app-page";

export default async function BusinessSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OpenInAppPage type="business" id={id} title="Business" />;
}
