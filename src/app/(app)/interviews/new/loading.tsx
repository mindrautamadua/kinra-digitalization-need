import { SkeletonForm, SkeletonPage, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat formulir wawancara…">
      <SkeletonPageHeader />
      <SkeletonForm fields={8} />
    </SkeletonPage>
  );
}
