import { SkeletonForm, SkeletonPage, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat wawancara…">
      <SkeletonPageHeader />
      <SkeletonForm fields={8} />
    </SkeletonPage>
  );
}
