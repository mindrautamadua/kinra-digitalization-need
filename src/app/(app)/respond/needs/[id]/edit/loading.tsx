import { SkeletonForm, SkeletonPage, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat formulir kebutuhan…">
      <SkeletonPageHeader />
      <SkeletonForm fields={12} />
    </SkeletonPage>
  );
}
