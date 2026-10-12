import { SkeletonForm, SkeletonPage, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat profil Bagian…">
      <SkeletonPageHeader />
      <SkeletonForm fields={8} />
    </SkeletonPage>
  );
}
