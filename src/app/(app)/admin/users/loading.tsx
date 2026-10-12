import { SkeletonCardListWithSideForm, SkeletonPage, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat pengguna…">
      <SkeletonPageHeader />
      <SkeletonCardListWithSideForm />
    </SkeletonPage>
  );
}
