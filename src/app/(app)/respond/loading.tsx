import { SkeletonCard, SkeletonPage, SkeletonPageHeader, SkeletonTable } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat assessment Bagian…">
      <SkeletonPageHeader actions={1} />
      <div className="space-y-6">
        <SkeletonCard lines={3} />
        <SkeletonTable columns={6} rows={5} />
      </div>
    </SkeletonPage>
  );
}
