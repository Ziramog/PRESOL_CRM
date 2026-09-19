import { BottomNav } from './bottom-nav';
import { Sidebar } from './sidebar';
import { MobileHeader } from './mobile-header';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row overflow-x-hidden">
      <div 
        className="fixed top-0 left-0 right-0 h-1.5 z-50 animate-gradient-x"
        style={{ 
          background: 'linear-gradient(to right, #4facfe, #689df6, #8e8bf0, #bd73e8, #d946ef, #bd73e8, #8e8bf0, #689df6, #4facfe)' 
        }}
      />
      <Sidebar />
      <main className="flex-1 md:pl-64 pb-16 md:pb-0 flex flex-col">
        <MobileHeader />
        <div className="h-full w-full p-4 md:p-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
