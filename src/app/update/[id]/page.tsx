import { OpenInAppPage } from "@/components/open-in-app-page";

export default async function UpdateSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OpenInAppPage type="update" id={id} title="City Update" />;
}
