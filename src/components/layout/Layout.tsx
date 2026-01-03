import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
    children: ReactNode;
    userEmail?: string;
}

export function Layout({ children, userEmail }: LayoutProps) {
    return (
        <div className="flex h-screen bg-app-bg overflow-hidden">
            <Sidebar userEmail={userEmail} />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
