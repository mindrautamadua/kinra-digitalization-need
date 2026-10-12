import { SkeletonForm, SkeletonPage, SkeletonPageHeader, SkeletonTable } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Memuat periode assessment…">
      <SkeletonPageHeader actions={1} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonForm fields={6} />
        <SkeletonTable columns={4} rows={6} />
      </div>
    </SkeletonPage>
  );
}
