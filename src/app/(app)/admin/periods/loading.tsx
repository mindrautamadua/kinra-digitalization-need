import { SkeletonCardListWithSideForm, SkeletonPage, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat periode assessment…">
      <SkeletonPageHeader />
      <SkeletonCardListWithSideForm />
    </SkeletonPage>
  );
}
