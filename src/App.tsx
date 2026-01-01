import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/ui/UserMenu';

/**
 * 应用布局组件
 */
export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-bold text-xl text-ecnu-blue">
              <span>🍜</span>
              <span>ECNU Eat</span>
            </a>
            <UserMenu />
          </div>
        </header>

        {/* 主内容区 */}
        <main className="p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* 底部 */}
        <footer className="py-8 text-center text-sm text-gray-400">
          <p>Made with ❤️ for ECNU</p>
        </footer>
      </div>
    </AuthProvider>
  );
}
