import { SkeletonFilters, SkeletonPage, SkeletonPageHeader, SkeletonTable } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat audit trail…">
      <SkeletonPageHeader />
      <SkeletonFilters fields={3} />
      <SkeletonTable columns={5} rows={12} />
    </SkeletonPage>
  );
}
