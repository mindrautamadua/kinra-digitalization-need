import { SkeletonFilters, SkeletonPage, SkeletonPageHeader, SkeletonTable } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat register kebutuhan…">
      <SkeletonPageHeader actions={2} />
      <SkeletonFilters fields={5} />
      <SkeletonTable columns={9} rows={10} />
    </SkeletonPage>
  );
}
