import { useRootNavigationState, useSegments } from "expo-router";
import { useAuth } from "./AuthContext";

export function useProtectedRoute() {
    const segments = useSegments();
    const { user } = useAuth();
    const navigationState = useRootNavigationState();

    useEffect(() => {
        if (!navigationState?.key) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inProtectedGroup = segments[0] === "(app)";

        if (!user && inProtectedGroup) {
            // Redirect to login page
            router.replace('/login');
        } else if (user && inAuthGroup) {
            // Redirect to home page
            router.replace('/home');
        }
    }, [user, segments, navigationState?.key]);

    return null;
}