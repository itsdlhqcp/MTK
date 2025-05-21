import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { UserStorageService } from '../Storage/UserStorageService';
import { getUserData } from "@/services/userServices";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState({ status: '', progress: 0 });
    const [error, setError] = useState(null);
    const [isNewUser, setIsNewUser] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Initialize auth state
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setLoading(true);
                
                const storedUser = await UserStorageService.getUserData();
                if (storedUser) {
                    setUser(storedUser);
                    setIsNewUser(!!storedUser.is_new_user);
                }
        
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
        
                if (session?.user) {
                    const isNew = await checkUserStatus(session.user.id);
                    await updatedUserData(session.user, session.user.email);
                    setIsNewUser(isNew);
                    router.replace('/home');
                } else if (!storedUser) {
                    router.replace('/welcome');
                }
            } catch (error) {
                console.error('Initialize auth error:', error.message);
                setError(error.message || 'Authentication initialization failed');
                if (!user) router.replace('/welcome');
            } finally {
                setLoading(false);
                setLoadingProgress({ status: '', progress: 0 });
                setInitialized(true);
            }
        };

        initializeAuth();
    }, []);

    // Reset error state
    const clearError = () => {
        setError(null);
    };

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
            setError(error.message || 'Failed to check user status');
            return false;
        }
    };

    // Updated user context handler
    const updateUserContext = async (updatedUser) => {
        await UserStorageService.updateUserData(updatedUser);
        setUser(prev => ({ ...prev, ...updatedUser }));
    };

    const setAuth = async (authUser) => {
        if (authUser) {
            await UserStorageService.storeUserData(authUser);
        } else {
            await UserStorageService.clearUserData();
        }
        setUser(authUser);
    };

    const setUserData = async (userData) => {
        const updatedUser = { ...user, ...userData };
        await UserStorageService.storeUserData(updatedUser);
        setUser(updatedUser);
    };

    const updatedUserData = async (user, email) => {
        if (!user?.id) return;
        try {
            let res = await getUserData(user.id);
            if (res.success) {
                await setUserData({ ...res.data, email });
            } else {
                console.error('Error fetching user data:', res.msg);
                setError(res.msg || 'Failed to fetch user data');
            }
        } catch (error) {
            console.error('Error updating user data:', error);
            setError(error.message || 'Failed to update user data');
        }
    };
    
    // Logout with proper data cleanup
    const logout = async () => {
        try {
            setLoading(true);
            setLoadingProgress({ status: 'Signing out...', progress: 50 });
            // Clear stored user data first
            await UserStorageService.clearUserData();
            // Then sign out from Supabase
            await supabase.auth.signOut();
            // Update state last
            setUser(null);
            setLoadingProgress({ status: 'Signed out successfully', progress: 100 });
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error.message);
            setError(error.message || 'Logout failed');
            return { error };
        } finally {
            setLoading(false);
            setTimeout(() => setLoadingProgress({ status: '', progress: 0 }), 500);
        }
    };

    // New password reset functions
    const loginWithToken = async ({ access_token, refresh_token }) => {
        try {
          //  setLoading(true);
            setLoadingProgress({ status: 'Verifying authentication token...', progress: 25 });
            
            await supabase.auth.setSession({
                access_token,
                refresh_token,
            });
            
            setLoadingProgress({ status: 'Refreshing session...', progress: 50 });
            const { data: { user: supabaseUser }, error } = await supabase.auth.refreshSession();
            
            if (error) throw error;
            
            // Check user status after successful login
            setLoadingProgress({ status: 'Loading user data...', progress: 75 });
            const isNew = await checkUserStatus(supabaseUser.id);
            await setAuth(supabaseUser);
            
            setLoadingProgress({ status: 'Authentication complete', progress: 100 });
            return { user: supabaseUser, isNewUser: isNew, success: true };
        } catch (error) {
            console.error('Token login error:', error.message);
            setError(error.message || 'Authentication failed');
            return { error };
        } finally {
            setLoading(false);
            setTimeout(() => setLoadingProgress({ status: '', progress: 0 }), 500);
        }
    };

    const requestPasswordReset = async (email) => {
        try {
            setError(null);
            setLoading(true);
            setLoadingProgress({ status: 'Sending password reset email...', progress: 50 });
            
            const resetPasswordURL = Linking.createURL('/auth/onpasswordless');
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: resetPasswordURL,
            });

            if (error) throw error;
            
            setLoadingProgress({ status: 'Password reset email sent', progress: 100 });
            return { success: true };
        } catch (error) {
            console.error('Password reset request error:', error.message);
            setError(error.message || 'Failed to send password reset email');
            return { error };
        } finally {
            setLoading(false);
            setTimeout(() => setLoadingProgress({ status: '', progress: 0 }), 500);
        }
    };

    // const updatePassword = async (newPassword) => {
    //     try {
    //         setError(null);
    //         setLoading(true);
    //         setLoadingProgress({ status: 'Verifying password complexity...', progress: 25 });
            
    //         // Short delay to show verification step
    //         await new Promise(resolve => setTimeout(resolve, 300));
            
    //         setLoadingProgress({ status: 'Updating password...', progress: 50 });
            
    //         // Update password directly - no need for session check as we're already in a reset flow
    //         const { data, error } = await supabase.auth.updateUser({
    //             password: newPassword
    //         });
    
    //         if (error) throw error;
            
    //         // Ensure we have updated user data
    //         setLoadingProgress({ status: 'Updating user profile...', progress: 75 });
    //         if (data?.user) {
    //             await setAuth(data.user);
    //             await checkUserStatus(data.user.id);
    //             await updatedUserData(data.user, data.user.email);
    //         }
            
    //         setLoadingProgress({ status: 'Password updated successfully', progress: 100 });
            
    //         // Make sure to fully complete before returning
    //         await new Promise(resolve => setTimeout(resolve, 500));
            
    //         return { success: true, user: data?.user };
    //     } catch (error) {
    //         console.error('Password update error:', error.message);
    //         setError(error.message || 'Failed to update password');
    //         return { error };
    //     } finally {
    //         // Ensure loading state is properly cleared
    //         setLoading(false);
    //         // Use a slight delay before resetting progress
    //         setTimeout(() => setLoadingProgress({ status: '', progress: 0 }), 800);
    //     }
    // };


    const updatePassword = async (newPassword) => {
        console.log('----------- updatePassword STARTED -----------');
        console.log('Input received:', { passwordLength: newPassword?.length });
        
        try {
            console.log('Initializing password update process');
            setError(null);
            setLoading(true);
            
            console.log('Setting loading progress: 25% - Verifying password complexity');
            setLoadingProgress({ status: 'Verifying password complexity...', progress: 25 });
            
            // Short delay to show verification step
            console.log('Starting verification delay (300ms)');
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log('Verification delay completed');
            
            console.log('Setting loading progress: 50% - Updating password');
            setLoadingProgress({ status: 'Updating password...', progress: 50 });
            
            console.log('Calling Supabase auth.updateUser API');
            // Update password directly - no need for session check as we're already in a reset flow
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            });
            console.log('Supabase API response received:', { 
                hasData: !!data, 
                hasUser: !!data?.user, 
                hasError: !!error,
                errorMessage: error?.message
            });
    
            if (error) {
                console.log('Error detected in Supabase response:', error);
                throw error;
            }
            
            console.log('Setting loading progress: 75% - Updating user profile');
            setLoadingProgress({ status: 'Updating user profile...', progress: 75 });
            
            // Ensure we have updated user data
            if (data?.user) {
                console.log('User data available, updating local state');
                console.log('User ID:', data.user.id);
                console.log('User email:', data.user.email);
                
                console.log('Calling setAuth with user data');
                await setAuth(data.user);
                
                console.log('Calling checkUserStatus with user ID');
                await checkUserStatus(data.user.id);
                
                console.log('Calling updatedUserData with user and email');
                await updatedUserData(data.user, data.user.email);
                
                console.log('All user data update functions completed');
            } else {
                console.log('No user data available in response');
            }
            
            console.log('Setting loading progress: 100% - Password updated successfully');
            setLoadingProgress({ status: 'Password updated successfully', progress: 100 });
            
            // Make sure to fully complete before returning
            console.log('Starting final delay (500ms)');
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Final delay completed');
            
            console.log('Preparing success response');
            const result = { success: true, user: data?.user };
            console.log('Returning result:', result);
            
            return result;
        } catch (error) {
            console.error('Password update error caught:', error);
            console.error('Error details:', { 
                message: error.message, 
                code: error.code,
                name: error.name,
                stack: error.stack
            });
            
            setError(error.message || 'Failed to update password');
            
            console.log('Preparing error response');
            const errorResult = { error };
            console.log('Returning error result:', errorResult);
            
            return errorResult;
        } finally {
            console.log('Entering finally block');
            
            // Ensure loading state is properly cleared
            console.log('Setting loading state to false');
            setLoading(false);
            
            // Use a slight delay before resetting progress
            console.log('Setting timeout for progress reset (800ms)');
            setTimeout(() => {
                console.log('Resetting loading progress to 0%');
                setLoadingProgress({ status: '', progress: 0 });
            }, 800);
            
            console.log('----------- updatePassword COMPLETED -----------');
        }
    };

    // Handle URL parsing for deep links
    const parseDeepLink = async (url) => {
        try {
            setLoadingProgress({ status: 'Processing authentication link...', progress: 25 });
            // Replace # with ? for proper URL parsing
            const parsedUrl = url.includes('#') ? url.replace('#', '?') : url;
            const urlParams = new URLSearchParams(parsedUrl.split('?')[1]);
            
            const access_token = urlParams.get('access_token');
            const refresh_token = urlParams.get('refresh_token');
            
            if (access_token && refresh_token) {
                return await loginWithToken({ access_token, refresh_token });
            }
            
            setError('Invalid authentication link');
            return null;
        } catch (error) {
            console.error('Deep link parsing error:', error.message);
            setError(error.message || 'Failed to process authentication link');
            return null;
        } finally {
            if (!loading) {
                setTimeout(() => setLoadingProgress({ status: '', progress: 0 }), 500);
            }
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            loadingProgress,
            error,
            clearError,
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
            logout,
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

// import { createContext, useCallback, useContext, useEffect, useState } from "react";
// import { supabase } from '@/lib/supabase';
// import * as Linking from 'expo-linking';
// import { router } from 'expo-router';
// import { UserStorageService } from '../Storage/UserStorageService';
// import { getUserData } from "@/services/userServices";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [isNewUser, setIsNewUser] = useState(false);
//     const [initialized, setInitialized] = useState(false);

//     // Initialize auth state
//     useEffect(() => {
//         const initializeAuth = async () => {
//             try {
//                 setLoading(true);
                
//                 const storedUser = await UserStorageService.getUserData();
//                 if (storedUser) {
//                     setUser(storedUser);
//                     setIsNewUser(!!storedUser.is_new_user);
//                 }
        
//                 const { data: { session }, error } = await supabase.auth.getSession();
//                 if (error) throw error;
        
//                 if (session?.user) {
//                     const isNew = await checkUserStatus(session.user.id);
//                     await updatedUserData(session.user, session.user.email);
//                     setIsNewUser(isNew);
//                     router.replace('/home');
//                 } else if (!storedUser) {
//                     router.replace('/welcome');
//                 }
//             } catch (error) {
//                 console.error('Initialize auth error:', error.message);
//                 if (!user) router.replace('/welcome');
//             } finally {
//                 setLoading(false);
//                 setInitialized(true);
//             }
//         };

//         initializeAuth();
//     }, []);

//     // Check if user is new and needs to set preferences
//     const checkUserStatus = async (userId) => {
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

//             // If no data exists, create a new preferences record
//             if (!data) {
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

//     // Updated user context handler
//     const updateUserContext = async (updatedUser) => {
//         await UserStorageService.updateUserData(updatedUser);
//         setUser(prev => ({ ...prev, ...updatedUser }));
//     };

//     const setAuth = async (authUser) => {
//         if (authUser) {
//             await UserStorageService.storeUserData(authUser);
//         } else {
//             await UserStorageService.clearUserData();
//         }
//         setUser(authUser);
//     };

//     const setUserData = async (userData) => {
//         const updatedUser = { ...user, ...userData };
//         await UserStorageService.storeUserData(updatedUser);
//         setUser(updatedUser);
//     };

//     const updatedUserData = async (user, email) => {
//         if (!user?.id) return;
//         try {
//             let res = await getUserData(user.id);
//             if (res.success) {
//                 await setUserData({ ...res.data, email });
//             } else {
//                 console.error('Error fetching user data:', res.msg);
//             }
//         } catch (error) {
//             console.error('Error updating user data:', error);
//         }
//     };
    
//     // Logout with proper data cleanup
//     const logout = async () => {
//         try {
//             setLoading(true);
//             // Clear stored user data first
//             await UserStorageService.clearUserData();
//             // Then sign out from Supabase
//             await supabase.auth.signOut();
//             // Update state last
//             setUser(null);
//             return { success: true };
//         } catch (error) {
//             console.error('Logout error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     // New password reset functions
//     const loginWithToken = async ({ access_token, refresh_token }) => {
//         try {
//           //  setLoading(true);
//             await supabase.auth.setSession({
//                 access_token,
//                 refresh_token,
//             });
            
//             const { data: { user: supabaseUser }, error } = await supabase.auth.refreshSession();
            
//             if (error) throw error;
            
//             // Check user status after successful login
//             const isNew = await checkUserStatus(supabaseUser.id);
//             await setAuth(supabaseUser);
//             return { user: supabaseUser, isNewUser: isNew, success: true };
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
            
//             // Update password directly - no need for session check as we're already in a reset flow
//             const { data, error } = await supabase.auth.updateUser({
//                 password: newPassword
//             });

//             if (error) throw error;
            
//             // Ensure we have updated user data
//             if (data?.user) {
//                 await setAuth(data.user);
//                 await checkUserStatus(data.user.id);
//                 await updatedUserData(data.user, data.user.email);
//             }
            
//             return { success: true, user: data?.user };
//         } catch (error) {
//             console.error('Password update error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Handle URL parsing for deep links
//     const parseDeepLink = async (url) => {
//         try {
//             // Replace # with ? for proper URL parsing
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
//             isNewUser,
//             initialized,
//             setAuth,
//             setUserData,
//             updateUserContext,
//             requestPasswordReset,
//             updatePassword,
//             loginWithToken,
//             parseDeepLink,
//             checkUserStatus,
//             logout,
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

// import { createContext, useCallback, useContext, useEffect, useState } from "react";
// import { supabase } from '@/lib/supabase';
// import * as Linking from 'expo-linking';
// import { router } from 'expo-router';
// import { UserStorageService } from '../Storage/UserStorageService';
// import { getUserData } from "@/services/userServices";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [isNewUser, setIsNewUser] = useState(false);
//     const [initialized, setInitialized] = useState(false);

//     // Initialize auth state
//     useEffect(() => {
//         const initializeAuth = async () => {
//             try {
//                 setLoading(true);
                
//                 const storedUser = await UserStorageService.getUserData();
//                 if (storedUser) {
//                     setUser(storedUser);
//                     setIsNewUser(!!storedUser.is_new_user);
//                 }
        
//                 const { data: { session }, error } = await supabase.auth.getSession();
//                 if (error) throw error;
        
//                 if (session?.user) {
//                     const isNew = await checkUserStatus(session.user.id);
//                     await updatedUserData(session.user, session.user.email);
//                     setIsNewUser(isNew);
//                   router.replace('/home');
//                 } else if (!storedUser) {
//                     router.replace('/welcome');
//                 }
//             } catch (error) {
//                 console.error('Initialize auth error:', error.message);
//                 if (!user) router.replace('/welcome');
//             } finally {
//                 setLoading(false);
//                 setInitialized(true);
//             }
//         };

//         initializeAuth();
//     }, []);

//         // Check if user is new and needs to set preferences
//         const checkUserStatus = async (userId) => {
//             if (!userId) return false;
//             try {
//                 const { data, error } = await supabase
//                     .from('user_preferences')
//                     .select('*')
//                     .eq('userId', userId)
//                     .maybeSingle();
    
//                 if (error) {
//                     // If no record exists, user is new
//                     if (error.code === 'PGRST116') {
//                         setIsNewUser(true);
//                         return true;
//                     }
//                     throw error;
//                 }
    
//                 // If no data exists, create a new preferences record
//                 if (!data) {
//                     const { error: insertError } = await supabase
//                         .from('user_preferences')
//                         .insert({
//                             userId: userId,
//                             is_new_user: true
//                         });
    
//                     if (insertError) throw insertError;
    
//                     setIsNewUser(true);
//                     return true;
//                 }
                
//                 setIsNewUser(!!data?.is_new_user);
//                 return !!data?.is_new_user;
//             } catch (error) {
//                 console.error('Error checking user status:', error.message);
//                 return false;
//             }
//         };

//     // // Existing functions
//     // const updateUserContext = (updatedUser) => {
//     //     setUser(updatedUser);
//     // };
//     // Updated user context handler
//     const updateUserContext = async (updatedUser) => {
//         await UserStorageService.updateUserData(updatedUser);
//         setUser(prev => ({ ...prev, ...updatedUser }));
//     };

//     // const setAuth = authUser => {
//     //     setUser(authUser);
//     // };

//     const setAuth = async (authUser) => {
//         if (authUser) {
//             await UserStorageService.storeUserData(authUser);
//         } else {
//             await UserStorageService.clearUserData();
//         }
//         setUser(authUser);
//     };

//     // const setUserData = userData => {
//     //     setUser({ ...userData });
//     // };

//     const setUserData = async (userData) => {
//         const updatedUser = { ...user, ...userData };
//         await UserStorageService.storeUserData(updatedUser);
//         setUser(updatedUser);
//     };

//     const updatedUserData = async (user, email) => {
//         if (!user?.id) return;
//         try {
//             let res = await getUserData(user.id);
//             if (res.success) {
//                 await setUserData({ ...res.data, email });
//             } else {
//                 console.error('Error fetching user data:', res.msg);
//             }
//         } catch (error) {
//             console.error('Error updating user data:', error);
//         } finally {
//             setLoading(false); // Ensure loading stops if fetching fails
//         }
//     };
    
//     // Logout with proper data cleanup
//     const logout = async () => {
//         try {
//             setLoading(true);
//             // Clear stored user data first
//             await UserStorageService.clearUserData();
//             // Then sign out from Supabase
//             await supabase.auth.signOut();
//             // Update state last
//             setUser(null);
//             return { success: true };
//         } catch (error) {
//             console.error('Logout error:', error.message);
//             return { error };
//         } finally {
//             setLoading(false);
//         }
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
//             const {data , error } = await supabase.auth.updateUser({
//                 password: newPassword
//             });

//             if (error) throw error;
//             // Ensure we have updated user data
//             if (data?.user) {
//                 setAuth(data.user);
//                 await checkUserStatus(data.user.id);
//             }
//             return { success: true, user: data?.user };
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
//             setAuth,
//             setUserData,
//             updateUserContext,
//             requestPasswordReset,
//             updatePassword,
//             loginWithToken,
//             parseDeepLink,
//             checkUserStatus,
//             logout,
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

