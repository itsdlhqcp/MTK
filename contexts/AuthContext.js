// import { createContext, useCallback, useContext, useEffect, useState } from "react";
// import { supabase } from '@/lib/supabase';
// import * as Linking from 'expo-linking';
// import { router } from 'expo-router';
// import Toast from 'react-native-toast-message';
// import { UserStorageService } from '../Storage/UserStorageService';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [isNewUser, setIsNewUser] = useState(false);
//     const [initialized, setInitialized] = useState(false);
//     const [isRefreshing, setIsRefreshing] = useState(false);

//     // Initialize auth state
//     useEffect(() => {
//         const initializeAuth = async () => {
//             try {
//                 setLoading(true);
//                 // First try to get user data from storage
//                 const storedUser = await UserStorageService.getUserData();
                
//                 if (storedUser) {
//                     setUser(storedUser);
//                     setIsNewUser(!!storedUser.is_new_user);
//                     setInitialized(true);
//                     // Don't return early, still check with server for current session
//                 }

//                 // Get current session from Supabase
//                 const { data: { session }, error } = await supabase.auth.getSession();
                
//                 if (error) throw error;
                
//                 if (session?.user) {
//                     const isNew = await checkUserStatus(session.user.id);
//                     await updatedUserData(session.user, session.user.email);
//                     setIsNewUser(isNew);
//                     router.replace('/home'); // or your main screen
//                 } else if (!storedUser) {
//                     // Only redirect to welcome if we have neither stored user nor session
//                     router.replace('/welcome');
//                 }
//             } catch (error) {
//                 console.error('Initialize auth error:', error.message);
//                 // Only redirect to welcome if we don't have a stored user
//                 if (!user) {
//                     router.replace('/welcome');
//                 }
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

//     // Update user data from API and store securely
//     const updatedUserData = async (user, email) => {
//         if (!user?.id) return;
//         try {
//             let res = await getUserData(user.id);
//             console.log('got user data', res);
//             if (res.success) {
//                 const userData = { ...res.data, email, is_new_user: isNewUser };
//                 await setUserData(userData);
//                 return userData;
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
//             const { data, error } = await supabase.auth.updateUser({
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

//      // Fix for TOKEN_REFRESHED handling - replace the second onAuthStateChange effect
//      useEffect(() => {
//         if (!initialized) return;

//         const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
//             console.log('Auth state change (after init):', event, session?.user?.id);
            
//             // Handle token refresh events specifically
//             if (event === 'TOKEN_REFRESHED') {
//                 // Prevent multiple simultaneous refreshes
//                 if (isRefreshing) return;
                
//                 try {
//                     setIsRefreshing(true);
                    
//                     if (session?.user) {
//                         // Just update the stored session without triggering data refetch
//                         await UserStorageService.updateUserData({
//                             id: session.user.id,
//                             email: session.user.email
//                         });
//                     }
//                 } catch (error) {
//                     console.error('Token refresh handling error:', error);
//                 } finally {
//                     setIsRefreshing(false);
//                 }
//                 return; // Exit early for token refresh events
//             }
            
//             // Handle other events normally
//             if (session?.user) {
//                 if (event === 'PASSWORD_RECOVERY') {
//                     // Password recovery handled in other effect
//                 } else if (event === 'SIGNED_IN') {
//                     // Store user data securely
//                     await updatedUserData(session.user, session.user.email);
//                 }
//             } else if (event === 'SIGNED_OUT') {
//                 // Ensure user data is cleared
//                 await UserStorageService.clearUserData();
//             }
//         });

//         return () => subscription.unsubscribe();
//     }, [initialized, isRefreshing]);

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

// // Helper function to import getUserData from userServices
// const getUserData = async (userId) => {
//     try {
//         const { data, error } = await supabase
//         .from('users')
//         .select()
//         .eq('id', userId)
//         .single();
        
//         if (error) {
//             return {success: false, msg: error?.message};
//         }
//         return {success: true, data};
//     } catch(error) {
//         console.log('got error', error);
//         return {success: false, msg: error?.message};
//     }
// };













// below is code without the fix for TOKEN_REFRESHED 

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { UserStorageService } from '../Storage/UserStorageService';

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
                if (!user) router.replace('/welcome');
            } finally {
                setLoading(false);
                setInitialized(true);
            }
        };
        
        // const initializeAuth = async () => {
        //     try {
        //         // First try to get user data from storage
        //         const storedUser = await UserStorageService.getUserData();
                
        //         if (storedUser) {
        //             setUser(storedUser);
        //             setIsNewUser(!!storedUser.is_new_user);
        //             setInitialized(true);
        //             // Don't return early, still check with server for current session
        //         }

        //         // Get current session from Supabase
        //         const { data: { session }, error } = await supabase.auth.getSession();
                
        //         if (error) throw error;
                
        //         if (session?.user) {
        //             const isNew = await checkUserStatus(session.user.id);
        //             await updatedUserData(session.user, session.user.email);
        //             setIsNewUser(isNew);
        //             router.replace('/home'); // or your main screen
        //         } else if (!storedUser) {
        //             // Only redirect to welcome if we have neither stored user nor session
        //             router.replace('/welcome');
        //         }
        //     } catch (error) {
        //         console.error('Initialize auth error:', error.message);
        //         // Only redirect to welcome if we don't have a stored user
        //         if (!user) {
        //             router.replace('/welcome');
        //         }
        //     } finally {
        //         setLoading(false);
        //         setInitialized(true);
        //     }
        // };

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

    // // Existing functions
    // const updateUserContext = (updatedUser) => {
    //     setUser(updatedUser);
    // };
    // Updated user context handler
    const updateUserContext = async (updatedUser) => {
        await UserStorageService.updateUserData(updatedUser);
        setUser(prev => ({ ...prev, ...updatedUser }));
    };

    // const setAuth = authUser => {
    //     setUser(authUser);
    // };

    const setAuth = async (authUser) => {
        if (authUser) {
            await UserStorageService.storeUserData(authUser);
        } else {
            await UserStorageService.clearUserData();
        }
        setUser(authUser);
    };

    // const setUserData = userData => {
    //     setUser({ ...userData });
    // };

    const setUserData = async (userData) => {
        const updatedUser = { ...user, ...userData };
        await UserStorageService.storeUserData(updatedUser);
        setUser(updatedUser);
    };

    // Update user data from API and store securely
    // const updatedUserData = async (user, email) => {
    //     if (!user?.id) return;
    //     try {
    //         let res = await getUserData(user.id);
    //         console.log('got user data', res);
    //         if (res.success) {
    //             const userData = { ...res.data, email, is_new_user: isNewUser };
    //             await setUserData(userData);
    //             return userData;
    //         }
    //     } catch (error) {
    //         console.error('Error updating user data:', error);
    //     }
    // };

    const updatedUserData = async (user, email) => {
        if (!user?.id) return;
        try {
            let res = await getUserData(user.id);
            if (res.success) {
                await setUserData({ ...res.data, email });
            } else {
                console.error('Error fetching user data:', res.msg);
            }
        } catch (error) {
            console.error('Error updating user data:', error);
        } finally {
            setLoading(false); // Ensure loading stops if fetching fails
        }
    };
    
    // Logout with proper data cleanup
    const logout = async () => {
        try {
            setLoading(true);
            // Clear stored user data first
            await UserStorageService.clearUserData();
            // Then sign out from Supabase
            await supabase.auth.signOut();
            // Update state last
            setUser(null);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error.message);
            return { error };
        } finally {
            setLoading(false);
        }
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
            const {data , error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            // Ensure we have updated user data
            if (data?.user) {
                setAuth(data.user);
                await checkUserStatus(data.user.id);
            }
            return { success: true, user: data?.user };
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












// below is code without the fix for TOKEN_REFRESHED 

// import { createContext, useCallback, useContext, useEffect, useState } from "react";
// import { supabase } from '@/lib/supabase';
// import * as Linking from 'expo-linking';
// import { router } from 'expo-router';
// import Toast from 'react-native-toast-message';
// import { UserStorageService } from '../Storage/UserStorageService';

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
//                 // First try to get user data from storage
//                 const storedUser = await UserStorageService.getUserData();
                
//                 if (storedUser) {
//                     setUser(storedUser);
//                     setIsNewUser(!!storedUser.is_new_user);
//                     setInitialized(true);
//                     // Don't return early, still check with server for current session
//                 }

//                 // Get current session from Supabase
//                 const { data: { session }, error } = await supabase.auth.getSession();
                
//                 if (error) throw error;
                
//                 if (session?.user) {
//                     const isNew = await checkUserStatus(session.user.id);
//                     await updatedUserData(session.user, session.user.email);
//                     setIsNewUser(isNew);
//                     router.replace('/home'); // or your main screen
//                 } else if (!storedUser) {
//                     // Only redirect to welcome if we have neither stored user nor session
//                     router.replace('/welcome');
//                 }
//             } catch (error) {
//                 console.error('Initialize auth error:', error.message);
//                 // Only redirect to welcome if we don't have a stored user
//                 if (!user) {
//                     router.replace('/welcome');
//                 }
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

//     // Update user data from API and store securely
//     const updatedUserData = async (user, email) => {
//         if (!user?.id) return;
//         try {
//             let res = await getUserData(user.id);
//             console.log('got user data', res);
//             if (res.success) {
//                 const userData = { ...res.data, email, is_new_user: isNewUser };
//                 await setUserData(userData);
//                 return userData;
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
//             const { error } = await supabase.auth.updateUser({
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




















// import { createContext, useCallback, useContext, useEffect, useState } from "react";
// import { supabase } from '@/lib/supabase';
// import * as Linking from 'expo-linking';
// import { router } from 'expo-router';
// import Toast from 'react-native-toast-message';
// import { UserStorageService } from '../Storage/UserStorageService';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [isNewUser, setIsNewUser] = useState(false);
//     const [initialized, setInitialized] = useState(false);

//     //    // Initialize auth state
//     //    useEffect(() => {
//     //     const initializeAuth = async () => {
//     //         try {
//     //             // Get current session
//     //             const { data: { session }, error } = await supabase.auth.getSession();
                
//     //             if (error) throw error;
                
//     //             if (session?.user) {
//     //                 const isNew = await checkUserStatus(session.user.id);
//     //                 setAuth(session.user);
//     //                 setIsNewUser(isNew);
//     //                 router.replace('/home'); // or your main screen
//     //             } else {
//     //                 // setAuth(null);
//     //                 // router.replace('/welcome');
//     //             }
//     //         } catch (error) {
//     //           //  console.error('Initialize auth error:', error.message);
//     //             // setAuth(null);
//     //             // router.replace('/welcome');
//     //         } finally {
//     //             setLoading(false);
//     //             setInitialized(true);
//     //         }
//     //     };

//     //     initializeAuth();
//     // }, []);

//     // Initialize auth state
//     useEffect(() => {
//         const initializeAuth = async () => {
//             try {
//                 // First try to get user data from storage
//                 const storedUser = await UserStorageService.getUserData();
                
//                 if (storedUser) {
//                     setUser(storedUser);
//                     setIsNewUser(!!storedUser.is_new_user);
//                     setInitialized(true);
//                     // Don't return early, still check with server for current session
//                 }

//                 // Get current session from Supabase
//                 const { data: { session }, error } = await supabase.auth.getSession();
                
//                 if (error) throw error;
                
//                 if (session?.user) {
//                     const isNew = await checkUserStatus(session.user.id);
//                     await updatedUserData(session.user, session.user.email);
//                     setIsNewUser(isNew);
//                     router.replace('/home'); // or your main screen
//                 } else if (!storedUser) {
//                     // Only redirect to welcome if we have neither stored user nor session
//                     router.replace('/welcome');
//                 }
//             } catch (error) {
//                 console.error('Initialize auth error:', error.message);
//                 // Only redirect to welcome if we don't have a stored user
//                 if (!user) {
//                     router.replace('/welcome');
//                 }
//             } finally {
//                 setLoading(false);
//                 setInitialized(true);
//             }
//         };

//         initializeAuth();
//     }, []);

//     //    // Check if user is new and needs to set preferences
//     //    const checkUserStatus = async (userId) => {
//     //     if (!userId) return false;
//     //     try {
//     //         const { data, error } = await supabase
//     //             .from('user_preferences')
//     //             .select('*')
//     //             .eq('userId', userId)
//     //             .maybeSingle();

//     //         if (error) {
//     //             // If no record exists, user is new
//     //             if (error.code === 'PGRST116') {
//     //                 setIsNewUser(true);
//     //                 return true;
//     //             }
//     //             throw error;
//     //         }

//     //           // If no data exists, create a new preferences record
//     //           if (!data) {
//     //             const { error: insertError } = await supabase
//     //                 .from('user_preferences')
//     //                 .insert({
//     //                     userId: userId,
//     //                     is_new_user: true
//     //                 });

//     //             if (insertError) throw insertError;

//     //             setIsNewUser(true);
//     //             return true;
//     //         }
            
//     //         setIsNewUser(!!data?.is_new_user);
//     //         return !!data?.is_new_user;
//     //     } catch (error) {
//     //         console.error('Error checking user status:', error.message);
//     //         return false;
//     //     }
//     // };

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

//     // Update user data from API and store securely
//     const updatedUserData = async (user, email) => {
//         if (!user?.id) return;
//         try {
//             let res = await getUserData(user.id);
//             console.log('got user data', res);
//             if (res.success) {
//                 const userData = { ...res.data, email, is_new_user: isNewUser };
//                 await setUserData(userData);
//                 return userData;
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
//             const { error } = await supabase.auth.updateUser({
//                 password: newPassword
//             });

//             if (error) throw error;
//             // Ensure we have updated user data
//             if (data?.user) {
//                 setAuth(data.user);
//                 await checkUserStatus(data.user.id);
//             }
//             // setLoading(false);
//             // Toast.show({
//             //     type: 'success',
//             //     text1: 'Success',
//             //     text2: 'Your password has been reset successfully',
//             //     position: 'top',
//             //     visibilityTime: 3000,
//             // });
//             // router.replace('/profile');
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


