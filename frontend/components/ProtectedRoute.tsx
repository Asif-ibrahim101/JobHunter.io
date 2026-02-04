'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface ProtectedRouteProps {
    children: ReactNode;
    skipOnboardingCheck?: boolean;
}

export default function ProtectedRoute({ children, skipOnboardingCheck = false }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [checkingProfile, setCheckingProfile] = useState(true);
    const [hasProfile, setHasProfile] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const checkProfile = async () => {
            if (!user || skipOnboardingCheck) {
                setCheckingProfile(false);
                return;
            }

            try {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (profile) {
                    setHasProfile(true);
                } else {
                    // No profile, redirect to onboarding
                    router.push('/onboarding');
                    return;
                }
            } catch {
                // No profile found, redirect to onboarding
                router.push('/onboarding');
                return;
            }

            setCheckingProfile(false);
        };

        if (user && !loading) {
            checkProfile();
        }
    }, [user, loading, router, skipOnboardingCheck]);

    if (loading || checkingProfile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}
