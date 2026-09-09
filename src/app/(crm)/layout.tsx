import { MainLayout } from '@/components/layout/main-layout';

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
