import { Users } from 'lucide-react';
import { usePresence, OnlineUser } from '../../hooks/usePresence';

interface OnlineUsersProps {
    currentUserId: string | null;
    collapsed: boolean;
}

const ROLE_COLORS: Record<string, string> = {
    admin: 'text-red-400',
    superviseur: 'text-purple-400',
    charge_affaire: 'text-blue-400',
    poseur: 'text-green-400',
};

const ROLE_BG_COLORS: Record<string, string> = {
    admin: 'bg-red-500',
    superviseur: 'bg-purple-500',
    charge_affaire: 'bg-blue-500',
    poseur: 'bg-green-500',
};

function getUserDisplayName(user: OnlineUser): string {
    if (user.firstName) {
        return user.firstName;
    }
    // Fallback to email prefix
    return user.email.split('@')[0];
}

export function OnlineUsers({ currentUserId, collapsed }: OnlineUsersProps) {
    const { onlineUsers } = usePresence(currentUserId);

    // Don't show anything if no users online
    if (onlineUsers.length === 0) {
        return null;
    }

    if (collapsed) {
        return (
            <div className="p-2 flex justify-center border-t border-slate-700/50" data-testid="online-users-collapsed">
                <div className="relative">
                    <Users className="w-5 h-5 text-green-400" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium" data-testid="online-users-count-badge">
                        {onlineUsers.length}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 border-t border-slate-700/50 animate-fadeIn" data-testid="online-users-section">
            <div className="flex items-center gap-2 mb-2">
                <div className="relative">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide" data-testid="online-users-label">
                    En ligne ({onlineUsers.length})
                </span>
            </div>

            <div className="flex flex-wrap gap-1.5" data-testid="online-users-list">
                {onlineUsers.map((user) => (
                    <div
                        key={user.id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors"
                        title={`${user.email} - ${user.role}`}
                        data-testid={`online-user-${user.id}`}
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${ROLE_BG_COLORS[user.role] || 'bg-slate-500'}`}
                        />
                        <span className={`text-xs truncate max-w-[80px] ${ROLE_COLORS[user.role] || 'text-slate-400'}`}>
                            {getUserDisplayName(user)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
