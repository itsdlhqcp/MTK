// import {  createContext, useContext, useState } from "react";

// const AuthContext = createContext();

// export const AuthProvider = ({children}) => {
//     const [user, setUser] = useState(null); 

//     const updateUserContext = (updatedUser) => {
//         setUser(updatedUser);
//       };

//     const setAuth = authUser=>{
//         setUser(authUser);
//     }

//     const setUserData = userData => {
//         setUser({...userData});
//     }

//     return (
//         <AuthContext.Provider value={{user, setAuth, setUserData, updateUserContext }}>
//            {children}
//         </AuthContext.Provider>
//     )
// }

// export const useAuth = () => useContext(AuthContext);




// import { createContext, useContext, useState } from "react";
// import { supabase } from '@/lib/supabase';
// import * as Linking from 'expo-linking';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(false);

//     // Existing functions
//     const updateUserContext = (updatedUser) => {
//         setUser(updatedUser);
//     };

//     const setAuth = authUser => {
//         setUser(authUser);
//     };

//     const setUserData = userData => {
//         setUser({ ...userData });
//     };

//     // New password reset functions
//     const loginWithToken = async ({ access_token, refresh_token }) => {
//         try {
//             await supabase.auth.setSession({
//                 access_token,
//                 refresh_token,
//             });
            
//             const { data: { user: supabaseUser }, error } = await supabase.auth.refreshSession();
            
//             if (error) throw error;
            
//             setAuth(supabaseUser);
//             return { user: supabaseUser };
//         } catch (error) {
//             console.error('Token login error:', error.message);
//             return { error };
//         }
//     };

//     const requestPasswordReset = async (email) => {
//         try {
//             setLoading(true);
//             const resetPasswordURL = Linking.createURL('/auth/reset');
            
//             const { error } = await supabase.auth.resetPasswordForEmail(email, {
//                 redirectTo: resetPasswordURL,
//             });

//             if (error) throw error;
            
//             return { success: true };
//         } catch (error) {
//             console.error('Password reset request error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     const updatePassword = async (newPassword) => {
//         try {
//             setLoading(true);
//             const { error } = await supabase.auth.updateUser({
//                 password: newPassword
//             });

//             if (error) throw error;

//             return { success: true };
//         } catch (error) {
//             console.error('Password update error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Handle URL parsing for deep links
//     const parseDeepLink = (url) => {
//         try {
//             // Replace # with ? for proper URL parsing
//             const parsedUrl = url.includes('#') ? url.replace('#', '?') : url;
//             const urlParams = new URLSearchParams(parsedUrl.split('?')[1]);
            
//             const access_token = urlParams.get('access_token');
//             const refresh_token = urlParams.get('refresh_token');

//             if (access_token && refresh_token) {
//                 return loginWithToken({ access_token, refresh_token });
//             }
            
//             return null;
//         } catch (error) {
//             console.error('Deep link parsing error:', error.message);
//             return null;
//         }
//     };

//     return (
//         <AuthContext.Provider value={{
//             user,
//             loading,
//             setAuth,
//             setUserData,
//             updateUserContext,
//             requestPasswordReset,
//             updatePassword,
//             loginWithToken,
//             parseDeepLink
//         }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error('useAuth must be used within an AuthProvider');
//     }
//     return context;
// };








// import { createContext, useContext, useState } from "react";
// import { supabase } from '@/lib/supabase';
// import * as Linking from 'expo-linking';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [resetSession, setResetSession] = useState(null);

//     const updateUserContext = (updatedUser) => {
//         setUser(updatedUser);
//     };

//     const setAuth = authUser => {
//         setUser(authUser);
//     };

//     const setUserData = userData => {
//         setUser({ ...userData });
//     };

//     const loginWithToken = async ({ access_token, refresh_token }) => {
//         try {
//             await supabase.auth.setSession({
//                 access_token,
//                 refresh_token,
//             });
            
//             const { data: { user: supabaseUser }, error } = await supabase.auth.refreshSession();
            
//             if (error) throw error;
            
//             // Store the session for password reset
//             setResetSession({ access_token, refresh_token });
//             setAuth(supabaseUser);
//             return { user: supabaseUser };
//         } catch (error) {
//             console.error('Token login error:', error.message);
//             return { error };
//         }
//     };

//     const requestPasswordReset = async (email) => {
//         try {
//             setLoading(true);
//             const resetPasswordURL = Linking.createURL('auth/reset');
            
//             const { error } = await supabase.auth.resetPasswordForEmail(email, {
//                 redirectTo: resetPasswordURL,
//             });

//             if (error) throw error;
            
//             return { success: true };
//         } catch (error) {
//             console.error('Password reset request error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     const updatePassword = async (newPassword) => {
//         try {
//             setLoading(true);
            
//             // If we have a reset session, use it first
//             if (resetSession) {
//                 await supabase.auth.setSession(resetSession);
//             }

//             const { error } = await supabase.auth.updateUser({
//                 password: newPassword
//             });

//             if (error) throw error;

//             // Clear the reset session after successful password update
//             setResetSession(null);
//             return { success: true };
//         } catch (error) {
//             console.error('Password update error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     const parseDeepLink = (url) => {
//         try {
//             const parsedUrl = url.includes('#') ? url.replace('#', '?') : url;
//             const urlParams = new URLSearchParams(parsedUrl.split('?')[1]);
            
//             const access_token = urlParams.get('access_token');
//             const refresh_token = urlParams.get('refresh_token');

//             if (access_token && refresh_token) {
//                 return loginWithToken({ access_token, refresh_token });
//             }
            
//             return null;
//         } catch (error) {
//             console.error('Deep link parsing error:', error.message);
//             return null;
//         }
//     };

//     return (
//         <AuthContext.Provider value={{
//             user,
//             loading,
//             setAuth,
//             setUserData,
//             updateUserContext,
//             requestPasswordReset,
//             updatePassword,
//             loginWithToken,
//             parseDeepLink,
//             resetSession
//         }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error('useAuth must be used within an AuthProvider');
//     }
//     return context;
// };
















// import { createContext, useContext, useState } from "react";
// import { supabase } from '@/lib/supabase';
// import * as Linking from 'expo-linking';
// import AsyncStorage from '@react-native-async-storage/async-storage'

// const AuthContext = createContext();

// const RESET_SESSION_KEY = '@auth_reset_session';

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [tokenSession, setTokenSession] = useState(null);

    

//     const updateUserContext = (updatedUser) => {
//         setUser(updatedUser);
//     };

//     const setAuth = authUser => {
//         setUser(authUser);
//     };

//     const setUserData = userData => {
//         setUser({ ...userData });
//     };

//     const loginWithToken = async ({ access_token, refresh_token }) => {
//         try {
//             setLoading(true);
            
//             // Set the session with the tokens
//             const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
//                 access_token,
//                 refresh_token,
//             });

//             if (sessionError) throw sessionError;

//             // Store the token session for password reset
//             setTokenSession({
//                 access_token,
//                 refresh_token
//             });

//             // Get user data after setting session
//             const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
            
//             if (userError) throw userError;

//             setAuth(currentUser);
//             return { user: currentUser };
//         } catch (error) {
//             console.error('Token login error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     const requestPasswordReset = async (email) => {
//         try {
//             setLoading(true);
//             const resetPasswordURL = Linking.createURL('/auth/reset');
            
//             const { error } = await supabase.auth.resetPasswordForEmail(email, {
//                 redirectTo: resetPasswordURL,
//             });

//             if (error) throw error;
            
//             return { success: true };
//         } catch (error) {
//             console.error('Password reset request error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     const updatePassword = async (newPassword) => {
//         try {
//             setLoading(true);

//             // If we have a token session, ensure it's set before updating password
//             if (tokenSession) {
//                 const { error: sessionError } = await supabase.auth.setSession(tokenSession);
//                 if (sessionError) throw sessionError;
//             }

//             const { data, error } = await supabase.auth.updateUser({
//                 password: newPassword
//             });

//             if (error) throw error;

//             // Clear the token session after successful password update
//             setTokenSession(null);
            
//             // Update the user context with the latest user data
//             if (data?.user) {
//                 setAuth(data.user);
//             }

//             return { success: true };
//         } catch (error) {
//             console.error('Password update error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     const parseDeepLink = async (url) => {
//         try {
//             const parsedUrl = url.includes('#') ? url.replace('#', '?') : url;
//             const urlParams = new URLSearchParams(parsedUrl.split('?')[1]);
            
//             const access_token = urlParams.get('access_token');
//             const refresh_token = urlParams.get('refresh_token');

//             if (access_token && refresh_token) {
//                 return await loginWithToken({ access_token, refresh_token });
//             }
            
//             return null;
//         } catch (error) {
//             console.error('Deep link parsing error:', error.message);
//             return null;
//         }
//     };

//     return (
//         <AuthContext.Provider value={{
//             user,
//             loading,
//             setAuth,
//             setUserData,
//             updateUserContext,
//             requestPasswordReset,
//             updatePassword,
//             loginWithToken,
//             parseDeepLink,
//             tokenSession
//         }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error('useAuth must be used within an AuthProvider');
//     }
//     return context;
// };













// import { createContext, useContext, useState } from "react";
// import { supabase } from '@/lib/supabase';
// import * as Linking from 'expo-linking';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const AuthContext = createContext();

// const RESET_SESSION_KEY = '@auth_reset_session';

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [tokenSession, setTokenSession] = useState(null);

//     const updateUserContext = (updatedUser) => {
//         setUser(updatedUser);
//     };

//     const setAuth = authUser => {
//         setUser(authUser);
//     };

//     const setUserData = userData => {
//         setUser({ ...userData });
//     };

//     const loginWithToken = async ({ access_token, refresh_token }) => {
//         try {
//             setLoading(true);
            
//             // Set the session with the tokens
//             const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
//                 access_token,
//                 refresh_token,
//             });

//             if (sessionError) throw sessionError;

//             // Store the token session for password reset
//             setTokenSession({
//                 access_token,
//                 refresh_token
//             });

//             // Save token session to AsyncStorage
//             await AsyncStorage.setItem(RESET_SESSION_KEY, JSON.stringify({
//                 access_token,
//                 refresh_token
//             }));

//             // Get user data after setting session
//             const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
            
//             if (userError) throw userError;

//             setAuth(currentUser);
//             return { user: currentUser };
//         } catch (error) {
//             console.error('Token login error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     const requestPasswordReset = async (email) => {
//         try {
//             setLoading(true);
//             // Update to match your app's route structure
//             const resetPasswordURL = Linking.createURL('/auth/reset');
            
//             const { error } = await supabase.auth.resetPasswordForEmail(email, {
//                 redirectTo: resetPasswordURL,
//             });

//             if (error) throw error;
            
//             return { success: true };
//         } catch (error) {
//             console.error('Password reset request error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     const updatePassword = async (newPassword) => {
//         try {
//             setLoading(true);

//             // If we have a token session, ensure it's set before updating password
//             if (tokenSession) {
//                 const { error: sessionError } = await supabase.auth.setSession(tokenSession);
//                 if (sessionError) throw sessionError;
//             }

//             const { data, error } = await supabase.auth.updateUser({
//                 password: newPassword
//             });

//             if (error) throw error;

//             // Clear the token session after successful password update
//             setTokenSession(null);
//             await AsyncStorage.removeItem(RESET_SESSION_KEY);
            
//             // Update the user context with the latest user data
//             if (data?.user) {
//                 setAuth(data.user);
//             }

//             return { success: true };
//         } catch (error) {
//             console.error('Password update error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     const parseDeepLink = async (url) => {
//         try {
//             const parsedUrl = url.includes('#') ? url.replace('#', '?') : url;
//             const urlParams = new URLSearchParams(parsedUrl.split('?')[1]);
            
//             const access_token = urlParams.get('access_token');
//             const refresh_token = urlParams.get('refresh_token');

//             if (access_token && refresh_token) {
//                 return await loginWithToken({ access_token, refresh_token });
//             }
            
//             return null;
//         } catch (error) {
//             console.error('Deep link parsing error:', error.message);
//             return null;
//         }
//     };

//     const loadResetSession = async () => {
//         try {
//             const savedSession = await AsyncStorage.getItem(RESET_SESSION_KEY);
//             if (savedSession) {
//                 const session = JSON.parse(savedSession);
//                 setTokenSession(session);
//                 return session;
//             }
//             return null;
//         } catch (error) {
//             console.error('Error loading reset session:', error);
//             return null;
//         }
//     };

//     const clearResetSession = async () => {
//         try {
//             await AsyncStorage.removeItem(RESET_SESSION_KEY);
//             setTokenSession(null);
//         } catch (error) {
//             console.error('Error clearing reset session:', error);
//         }
//     };

//     return (
//         <AuthContext.Provider value={{
//             user,
//             loading,
//             setAuth,
//             setUserData,
//             updateUserContext,
//             requestPasswordReset,
//             updatePassword,
//             loginWithToken,
//             parseDeepLink,
//             tokenSession,
//             loadResetSession,
//             clearResetSession
//         }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error('useAuth must be used within an AuthProvider');
//     }
//     return context;
// };






































































































































































































































































































































































































































































































































































































































































































/// working code :-

// import { createContext, useCallback, useContext, useEffect, useState } from "react";
// import { supabase } from '@/lib/supabase';
// import * as Linking from 'expo-linking';
// import { router } from 'expo-router';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [isNewUser, setIsNewUser] = useState(false);

//     // Index Component for Route Protection
//     // const protectedRoutes = ['/home', '/profile'];
    
//     // const isProtectedRoute = useCallback((route) => {
//     //     return protectedRoutes.includes(route);
//     // }, []);

//     // const requireAuth = useCallback((Component) => {
//     //     return (props) => {
//     //         if (!user) {
//     //             router.replace('/login');
//     //             return null;
//     //         }
//     //         return <Component {...props} />;
//     //     };
//     // }, [user]);

//        // Global navigation listener
//     //    useEffect(() => {
//     //     // Subscribe to navigation state changes
//     //     const unsubscribe = router.addListener('state', (state) => {
//     //         const currentRoute = state?.routes?.[state.routes.length - 1]?.name;
//     //         if (currentRoute && !user && ['home', 'profile'].includes(currentRoute)) {
//     //             router.replace('/login');
//     //         }
//     //     });

//     //     return () => unsubscribe();
//     // }, [user]);

//     // Navigation guard
//     // const navigationGuard = useCallback((route) => {
//     //     if (isProtectedRoute(route) && !user) {
//     //         router.replace('/login');
//     //         return false;
//     //     }
//     //     return true;
//     // }, [user, isProtectedRoute]);


//       // Enhanced navigation guard
//     //   const navigationGuard = useCallback((segments) => {
//     //     const protectedRoutes = ['home', 'profile'];
//     //     const isProtectedRoute = protectedRoutes.includes(segments[0]);
        
//     //     if (isProtectedRoute && !user) {
//     //         // Force navigation to login and clear history
//     //         router.replace({
//     //             pathname: '/login',
//     //             params: {}
//     //         });
//     //         return false;
//     //     }
//     //     return true;
//     // }, [user]);

//     // Enhanced profile screen wrapper
//     // const withAuthProtection = (WrappedComponent) => {
//     //     return (props) => {
//     //         useEffect(() => {
//     //             if (!user) {
//     //                 router.replace('/welcome');
//     //             }
//     //         }, [user]);

//     //         if (!user) return null;
//     //         return <WrappedComponent {...props} />;
//     //     };
//     // };

//      // Enhanced logout function with navigation protection
//      const logout = useCallback(async () => {
//         try {
//             setLoading(true);
//             const { error } = await supabase.auth.signOut();
//             if (error) throw error;
            
//             // Clear auth state
//             setAuth(null);
            
//             // Reset navigation and prevent back navigation
//            // router.replace('/login');

//           //  router.replace('/welcome');
            
//             // Clear navigation history
//             router.setParams({});
            
//             return { success: true };
//         } catch (error) {
//             console.error('Logout error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//        // Check if user is new and needs to set preferences
//        const checkUserStatus = async (userId) => {
//         try {
//             const { data, error } = await supabase
//                 .from('user_preferences')
//                 .select('*')
//                 .eq('userId', userId)
//                 .maybeSingle();

//             if (error) {
//                 // If no record exists, user is new
//                 if (error.code === 'PGRST116') {
//                     setIsNewUser(true);
//                     return true;
//                 }
//                 throw error;
//             }

//               // If no data exists, create a new preferences record
//               if (!data) {
//                 const { error: insertError } = await supabase
//                     .from('user_preferences')
//                     .insert({
//                         userId: userId,
//                         is_new_user: true
//                     });

//                 if (insertError) throw insertError;

//                 setIsNewUser(true);
//                 return true;
//             }
            
//             setIsNewUser(!!data?.is_new_user);
//             return !!data?.is_new_user;
//         } catch (error) {
//             console.error('Error checking user status:', error.message);
//             return false;
//         }
//     };

//     // const markUserAsExisting = async (userId) => {
//     //     try {
//     //         const { error } = await supabase
//     //             .from('user_preferences')
//     //             .upsert({
//     //                 is_new_user: false,
//     //                 updated_at: new Date()
//     //             })
//     //             .eq('userId', userId);

//     //         if (error) throw error;
//     //         setIsNewUser(false);
//     //     } catch (error) {
//     //         console.error('Error updating user status:', error.message);
//     //     }
//     // };

//     // Existing functions
//     const updateUserContext = (updatedUser) => {
//         setUser(updatedUser);
//     };

//     const setAuth = authUser => {
//         setUser(authUser);
//     };

//     const setUserData = userData => {
//         setUser({ ...userData });
//     };

//     // New password reset functions
//     const loginWithToken = async ({ access_token, refresh_token }) => {
//         try {
//             await supabase.auth.setSession({
//                 access_token,
//                 refresh_token,
//             });
            
//             const { data: { user: supabaseUser }, error } = await supabase.auth.refreshSession();
            
//             if (error) throw error;
            
//             // setAuth(supabaseUser);
//             // return { user: supabaseUser };
//             // Check user status after successful login
//             const isNew = await checkUserStatus(supabaseUser.id);
//             setAuth(supabaseUser);
//             return { user: supabaseUser, isNewUser: isNew };
//         } catch (error) {
//             console.error('Token login error:', error.message);
//             return { error };
//         }
//     };

//     const requestPasswordReset = async (email) => {
//         try {
//             setLoading(true);
//             const resetPasswordURL = Linking.createURL('/auth/onpasswordless');
//             const { error } = await supabase.auth.resetPasswordForEmail(email, {
//                 redirectTo: resetPasswordURL,
//             });

//             if (error) throw error;
            
//             return { success: true };
//         } catch (error) {
//             console.error('Password reset request error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     const updatePassword = async (newPassword) => {
//         try {
//             setLoading(true);
//             const { error } = await supabase.auth.updateUser({
//                 password: newPassword
//             });

//             if (error) throw error;

//             return { success: true };
//         } catch (error) {
//             console.error('Password update error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Handle URL parsing for deep links
//     const parseDeepLink = (url) => {
//         try {
//             // Replace # with ? for proper URL parsing
//             const parsedUrl = url.includes('#') ? url.replace('#', '?') : url;
//             const urlParams = new URLSearchParams(parsedUrl.split('?')[1]);
            
//             const access_token = urlParams.get('access_token');
//             const refresh_token = urlParams.get('refresh_token');

//             if (access_token && refresh_token) {
//                 return loginWithToken({ access_token, refresh_token });
//             }
            
//             return null;
//         } catch (error) {
//             console.error('Deep link parsing error:', error.message);
//             return null;
//         }
//     };

//     return (
//         <AuthContext.Provider value={{
//             user,
//             loading,
//             isNewUser,
//             logout,
//             setAuth,
//             setUserData,
//             updateUserContext,
//             requestPasswordReset,
//             updatePassword,
//             loginWithToken,
//             parseDeepLink,
//             checkUserStatus,
//         }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error('useAuth must be used within an AuthProvider');
//     }
//     return context;
// };
















// ############# working code :- (latests 19)

// import { createContext, useCallback, useContext, useEffect, useState } from "react";
// import { supabase } from '@/lib/supabase';
// import * as Linking from 'expo-linking';
// import { router } from 'expo-router';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [isNewUser, setIsNewUser] = useState(false);
//     const [initialized, setInitialized] = useState(false);

//        // Initialize auth state
//        useEffect(() => {
//         const initializeAuth = async () => {
//             try {
//                 // Get current session
//                 const { data: { session }, error } = await supabase.auth.getSession();
                
//                 if (error) throw error;
                
//                 if (session?.user) {
//                     const isNew = await checkUserStatus(session.user.id);
//                  //   setAuth(session.user);
//                     setIsNewUser(isNew);
//                     router.replace('/home'); // or your main screen
//                 } else {
//                     setAuth(null);
//                     router.replace('/welcome');
//                 }
//             } catch (error) {
//               //  console.error('Initialize auth error:', error.message);
//                 setAuth(null);
//                 router.replace('/welcome');
//             } finally {
//                 setLoading(false);
//                 setInitialized(true);
//             }
//         };

//         initializeAuth();
//     }, []);

//      // Enhanced logout function with navigation protection
//     //  const logout = useCallback(async () => {
//     //     try {
//     //         setLoading(true);
//     //         const { error } = await supabase.auth.signOut();
//     //         if (error) throw error;
            
//     //         // Clear auth state
//     //         setAuth(null);
            
//     //         // Reset navigation and prevent back navigation
//     //        // router.replace('/login');

//     //       //  router.replace('/welcome');
            
//     //         // Clear navigation history
//     //         router.setParams({});
            
//     //         return { success: true };
//     //     } catch (error) {
//     //         console.error('Logout error:', error.message);
//     //         return { error };
//     //     } finally {
//     //         setLoading(false);
//     //     }
//     // }, []);

//        // Check if user is new and needs to set preferences
//        const checkUserStatus = async (userId) => {
//         if (!userId) return false;
//         try {
//             const { data, error } = await supabase
//                 .from('user_preferences')
//                 .select('*')
//                 .eq('userId', userId)
//                 .maybeSingle();

//             if (error) {
//                 // If no record exists, user is new
//                 if (error.code === 'PGRST116') {
//                     setIsNewUser(true);
//                     return true;
//                 }
//                 throw error;
//             }

//               // If no data exists, create a new preferences record
//               if (!data) {
//                 const { error: insertError } = await supabase
//                     .from('user_preferences')
//                     .insert({
//                         userId: userId,
//                         is_new_user: true
//                     });

//                 if (insertError) throw insertError;

//                 setIsNewUser(true);
//                 return true;
//             }
            
//             setIsNewUser(!!data?.is_new_user);
//             return !!data?.is_new_user;
//         } catch (error) {
//             console.error('Error checking user status:', error.message);
//             return false;
//         }
//     };

//     // Existing functions
//     const updateUserContext = (updatedUser) => {
//         setUser(updatedUser);
//     };

//     const setAuth = authUser => {
//         setUser(authUser);
//     };

//     const setUserData = userData => {
//         setUser({ ...userData });
//     };

//     // const setAuth = useCallback((authUser) => {
//     //     setUser(authUser);
//     // }, []);

//     // const setUserData = useCallback((userData) => {
//     //     setUser(prev => ({ ...prev, ...userData }));
//     // }, []);

//     // New password reset functions
//     const loginWithToken = async ({ access_token, refresh_token }) => {
//         try {
//             await supabase.auth.setSession({
//                 access_token,
//                 refresh_token,
//             });
            
//             const { data: { user: supabaseUser }, error } = await supabase.auth.refreshSession();
            
//             if (error) throw error;
            
//             // setAuth(supabaseUser);
//             // return { user: supabaseUser };
//             // Check user status after successful login
//             const isNew = await checkUserStatus(supabaseUser.id);
//             setAuth(supabaseUser);
//             return { user: supabaseUser, isNewUser: isNew };
//         } catch (error) {
//             console.error('Token login error:', error.message);
//             return { error };
//         }
//     };

//     const requestPasswordReset = async (email) => {
//         try {
//             setLoading(true);
//             const resetPasswordURL = Linking.createURL('/auth/onpasswordless');
//             const { error } = await supabase.auth.resetPasswordForEmail(email, {
//                 redirectTo: resetPasswordURL,
//             });

//             if (error) throw error;
            
//             return { success: true };
//         } catch (error) {
//             console.error('Password reset request error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     const updatePassword = async (newPassword) => {
//         try {
//             setLoading(true);
//             const { error } = await supabase.auth.updateUser({
//                 password: newPassword
//             });

//             if (error) throw error;

//             return { success: true };
//         } catch (error) {
//             console.error('Password update error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Handle URL parsing for deep links
//     const parseDeepLink = (url) => {
//         try {
//             // Replace # with ? for proper URL parsing
//             const parsedUrl = url.includes('#') ? url.replace('#', '?') : url;
//             const urlParams = new URLSearchParams(parsedUrl.split('?')[1]);
            
//             const access_token = urlParams.get('access_token');
//             const refresh_token = urlParams.get('refresh_token');

//             if (access_token && refresh_token) {
//                 return loginWithToken({ access_token, refresh_token });
//             }
            
//             return null;
//         } catch (error) {
//             console.error('Deep link parsing error:', error.message);
//             return null;
//         }
//     };

//     return (
//         <AuthContext.Provider value={{
//             user,
//             loading,
//             isNewUser,
//             initialized,
//             // logout,
//             setAuth,
//             setUserData,
//             updateUserContext,
//             requestPasswordReset,
//             updatePassword,
//             loginWithToken,
//             parseDeepLink,
//             checkUserStatus,
//         }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error('useAuth must be used within an AuthProvider');
//     }
//     return context;
// };




















import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const [initialized, setInitialized] = useState(false);

       // Initialize auth state
       useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Get current session
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) throw error;
                
                if (session?.user) {
                    const isNew = await checkUserStatus(session.user.id);
                 //   setAuth(session.user);
                    setIsNewUser(isNew);
                    router.replace('/home'); // or your main screen
                } else {
                    setAuth(null);
                    router.replace('/welcome');
                }
            } catch (error) {
              //  console.error('Initialize auth error:', error.message);
                setAuth(null);
                router.replace('/welcome');
            } finally {
                setLoading(false);
                setInitialized(true);
            }
        };

        initializeAuth();
    }, []);

       // Check if user is new and needs to set preferences
       const checkUserStatus = async (userId) => {
        if (!userId) return false;
        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('userId', userId)
                .maybeSingle();

            if (error) {
                // If no record exists, user is new
                if (error.code === 'PGRST116') {
                    setIsNewUser(true);
                    return true;
                }
                throw error;
            }

              // If no data exists, create a new preferences record
              if (!data) {
                const { error: insertError } = await supabase
                    .from('user_preferences')
                    .insert({
                        userId: userId,
                        is_new_user: true
                    });

                if (insertError) throw insertError;

                setIsNewUser(true);
                return true;
            }
            
            setIsNewUser(!!data?.is_new_user);
            return !!data?.is_new_user;
        } catch (error) {
            console.error('Error checking user status:', error.message);
            return false;
        }
    };

    // Existing functions
    const updateUserContext = (updatedUser) => {
        setUser(updatedUser);
    };

    const setAuth = authUser => {
        setUser(authUser);
    };

    const setUserData = userData => {
        setUser({ ...userData });
    };

    // New password reset functions
    const loginWithToken = async ({ access_token, refresh_token }) => {
        try {
            await supabase.auth.setSession({
                access_token,
                refresh_token,
            });
            
            const { data: { user: supabaseUser }, error } = await supabase.auth.refreshSession();
            
            if (error) throw error;
            
            // Check user status after successful login
            const isNew = await checkUserStatus(supabaseUser.id);
            setAuth(supabaseUser);
            return { user: supabaseUser, isNewUser: isNew };
        } catch (error) {
            console.error('Token login error:', error.message);
            return { error };
        }
    };

    const requestPasswordReset = async (email) => {
        try {
            setLoading(true);
            const resetPasswordURL = Linking.createURL('/auth/onpasswordless');
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: resetPasswordURL,
            });

            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('Password reset request error:', error.message);
            return { error };
        } finally {
            setLoading(false);
        }
    };

    const updatePassword = async (newPassword) => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Password update error:', error.message);
            return { error };
        } finally {
            setLoading(false);
        }
    };

    // Handle URL parsing for deep links
    const parseDeepLink = (url) => {
        try {
            // Replace # with ? for proper URL parsing
            const parsedUrl = url.includes('#') ? url.replace('#', '?') : url;
            const urlParams = new URLSearchParams(parsedUrl.split('?')[1]);
            
            const access_token = urlParams.get('access_token');
            const refresh_token = urlParams.get('refresh_token');

            if (access_token && refresh_token) {
                return loginWithToken({ access_token, refresh_token });
            }
            
            return null;
        } catch (error) {
            console.error('Deep link parsing error:', error.message);
            return null;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isNewUser,
            initialized,
            setAuth,
            setUserData,
            updateUserContext,
            requestPasswordReset,
            updatePassword,
            loginWithToken,
            parseDeepLink,
            checkUserStatus,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};