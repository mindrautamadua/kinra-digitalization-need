import { SkeletonCard, SkeletonPage, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat detail kebutuhan…">
      <SkeletonPageHeader actions={2} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={8} />
          <SkeletonCard lines={6} />
        </div>
        <div className="space-y-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={2} />
        </div>
      </div>
    </SkeletonPage>
  );
}
