import { SkeletonCard, SkeletonPage, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat detail kebutuhan…">
      <SkeletonPageHeader actions={2} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SkeletonCard lines={8} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={2} />
        </div>
        <div className="space-y-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      </div>
    </SkeletonPage>
  );
}
