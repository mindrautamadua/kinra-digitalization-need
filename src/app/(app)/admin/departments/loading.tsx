import { SkeletonCardListWithSideForm, SkeletonPage, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat master Bagian…">
      <SkeletonPageHeader />
      <SkeletonCardListWithSideForm />
    </SkeletonPage>
  );
}
