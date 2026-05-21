import Link from "next/link";

export function SendNotificationButton({ section }: { section: string }) {
  return (
    <Link
      href={`/notifications?section=${encodeURIComponent(section)}`}
      className="inline-flex items-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
    >
      Send Notification
    </Link>
  );
}
