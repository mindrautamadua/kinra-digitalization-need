import { SkeletonCard, SkeletonPage, SkeletonPageHeader, SkeletonStat } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat dashboard…">
      <SkeletonPageHeader actions={2} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} lines={5} />
        ))}
      </div>
    </SkeletonPage>
  );
}
