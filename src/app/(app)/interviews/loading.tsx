import { SkeletonPage, SkeletonPageHeader, SkeletonTable } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat daftar wawancara…">
      <SkeletonPageHeader actions={1} />
      <SkeletonTable columns={7} />
    </SkeletonPage>
  );
}
