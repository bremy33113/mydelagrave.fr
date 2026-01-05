import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
    children: ReactNode;
    userEmail?: string;
    userId?: string;
}

export function Layout({ children, userEmail, userId }: LayoutProps) {
    return (
        <div className="flex h-screen bg-app-bg overflow-hidden">
            <Sidebar userEmail={userEmail} userId={userId} />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
