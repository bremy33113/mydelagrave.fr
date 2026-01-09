import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { FloatingBurgerMenu } from './FloatingBurgerMenu';

interface LayoutProps {
    children: ReactNode;
    userEmail?: string;
    userId?: string;
    useBurgerMenu?: boolean;
}

export function Layout({ children, userEmail, userId, useBurgerMenu = false }: LayoutProps) {
    if (useBurgerMenu) {
        return (
            <div className="h-screen bg-app-bg overflow-hidden">
                <FloatingBurgerMenu userEmail={userEmail} userId={userId} />
                <main className="h-full overflow-auto">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-app-bg overflow-hidden">
            <Sidebar userEmail={userEmail} userId={userId} />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
