import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isUsingMock } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface OnlineUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    lastSeen: number;
}

interface PresenceState {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    online_at: string;
}

const HEARTBEAT_INTERVAL = 10000; // 10s
const OFFLINE_TIMEOUT = 30000; // 30s
const PRESENCE_STORAGE_KEY = 'user_presence';
const PRESENCE_CHANNEL_NAME = 'online-users';

export function usePresence(currentUserId: string | null) {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const userProfileRef = useRef<PresenceState | null>(null);

    // Refresh online users from localStorage (dev mode only)
    const refreshOnlineUsers = useCallback(() => {
        if (!isUsingMock) return;

        try {
            const presence = JSON.parse(localStorage.getItem(PRESENCE_STORAGE_KEY) || '{}');
            const now = Date.now();

            // Filter active users (seen in the last 30 seconds)
            const activeUsers: OnlineUser[] = [];
            const updatedPresence: Record<string, OnlineUser> = {};

            for (const [userId, userData] of Object.entries(presence)) {
                const user = userData as OnlineUser;
                if (now - user.lastSeen < OFFLINE_TIMEOUT) {
                    activeUsers.push(user);
                    updatedPresence[userId] = user;
                }
            }

            // Clean up stale entries
            localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(updatedPresence));
            setOnlineUsers(activeUsers);
        } catch {
            setOnlineUsers([]);
        }
    }, []);

    // Production mode: Supabase Realtime Presence
    useEffect(() => {
        if (isUsingMock || !currentUserId) return;

        let isSubscribed = false;

        const setupPresence = async () => {
            try {
                // Get current user profile
                const { data: userProfile } = await supabase
                    .from('users')
                    .select('id, email, first_name, last_name, role')
                    .eq('id', currentUserId)
                    .single();

                if (!userProfile) {
                    console.error('User profile not found');
                    return;
                }

                userProfileRef.current = {
                    id: userProfile.id,
                    email: userProfile.email,
                    firstName: userProfile.first_name || '',
                    lastName: userProfile.last_name || '',
                    role: userProfile.role,
                    online_at: new Date().toISOString(),
                };

                // Create presence channel
                const channel = supabase.channel(PRESENCE_CHANNEL_NAME, {
                    config: {
                        presence: {
                            key: currentUserId,
                        },
                    },
                });

                channelRef.current = channel;

                // Listen for presence sync
                channel.on('presence', { event: 'sync' }, () => {
                    const state = channel.presenceState() as Record<string, PresenceState[]>;
                    const users: OnlineUser[] = [];

                    for (const presences of Object.values(state)) {
                        if (Array.isArray(presences) && presences.length > 0) {
                            const p = presences[0] as PresenceState;
                            users.push({
                                id: p.id,
                                email: p.email,
                                firstName: p.firstName,
                                lastName: p.lastName,
                                role: p.role,
                                lastSeen: new Date(p.online_at).getTime(),
                            });
                        }
                    }

                    setOnlineUsers(users);
                });

                // Subscribe and track presence
                channel.subscribe(async (status: string) => {
                    if (status === 'SUBSCRIBED' && userProfileRef.current) {
                        isSubscribed = true;
                        await channel.track(userProfileRef.current);
                    }
                });

            } catch (err) {
                console.error('Error setting up presence:', err);
            }
        };

        setupPresence();

        // Cleanup
        return () => {
            if (channelRef.current && isSubscribed) {
                channelRef.current.untrack();
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [currentUserId]);

    // Dev mode: localStorage + BroadcastChannel
    useEffect(() => {
        if (!isUsingMock || !currentUserId) return;

        let broadcastChannel: BroadcastChannel | null = null;

        const updatePresence = async () => {
            try {
                // Get current user profile from users table
                const { data: userProfile } = await supabase
                    .from('users')
                    .select('id, email, first_name, last_name, role')
                    .eq('id', currentUserId)
                    .single();

                if (!userProfile) return;

                const presence = JSON.parse(localStorage.getItem(PRESENCE_STORAGE_KEY) || '{}');
                presence[currentUserId] = {
                    id: userProfile.id,
                    email: userProfile.email,
                    firstName: userProfile.first_name || '',
                    lastName: userProfile.last_name || '',
                    role: userProfile.role,
                    lastSeen: Date.now(),
                };
                localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(presence));

                // Broadcast to other tabs
                if (!broadcastChannel) {
                    broadcastChannel = new BroadcastChannel(PRESENCE_STORAGE_KEY);
                }
                broadcastChannel.postMessage({ type: 'heartbeat', userId: currentUserId });

                // Refresh local state
                refreshOnlineUsers();
            } catch (err) {
                console.error('Error updating presence:', err);
            }
        };

        // Initial update
        updatePresence();

        // Set up heartbeat interval
        const heartbeatInterval = setInterval(updatePresence, HEARTBEAT_INTERVAL);

        // Cleanup on unmount
        return () => {
            clearInterval(heartbeatInterval);
            if (broadcastChannel) {
                broadcastChannel.close();
            }
            // Remove user from presence
            const presence = JSON.parse(localStorage.getItem(PRESENCE_STORAGE_KEY) || '{}') as Record<string, OnlineUser>;
            const updatedPresence = Object.fromEntries(
                Object.entries(presence).filter(([key]) => key !== currentUserId)
            );
            localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(updatedPresence));
            // Broadcast removal
            const tempChannel = new BroadcastChannel(PRESENCE_STORAGE_KEY);
            tempChannel.postMessage({ type: 'leave', userId: currentUserId });
            tempChannel.close();
        };
    }, [currentUserId, refreshOnlineUsers]);

    // Dev mode: Listen for changes from other tabs
    useEffect(() => {
        if (!isUsingMock) return;

        const channel = new BroadcastChannel(PRESENCE_STORAGE_KEY);

        channel.onmessage = () => {
            refreshOnlineUsers();
        };

        // Initial load
        refreshOnlineUsers();

        // Periodic cleanup of stale users
        const cleanupInterval = setInterval(refreshOnlineUsers, 5000);

        return () => {
            channel.close();
            clearInterval(cleanupInterval);
        };
    }, [refreshOnlineUsers]);

    return { onlineUsers };
}
