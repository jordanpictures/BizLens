import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

function Layout() {
  return (
    <div className="flex h-screen bg-bg text-text font-sans pb-16 md:pb-0 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto pb-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
