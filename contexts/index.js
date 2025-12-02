import { useEffect } from "react";
import { useRootNavigationState, useSegments, useRouter } from "expo-router";
import { useAuth } from "./AuthContext";

export function useProtectedRoute() {
    const segments = useSegments();
    const { user } = useAuth();
    const navigationState = useRootNavigationState();
    const router = useRouter();

    useEffect(() => {
        if (!navigationState?.key) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inProtectedGroup = segments[0] === "(app)";

        if (!user && inProtectedGroup) {
            // Redirect to login page
            router.replace('/onboardingGrid');
        } else if (user && inAuthGroup) {
            // Redirect to spotlight page (feeds)
            router.replace('/feeds');
        }
    }, [user, segments, navigationState?.key, router]);

    return null;
}