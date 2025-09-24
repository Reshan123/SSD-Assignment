import { createContext, useReducer, useEffect } from "react";
import SecureStorage from "../utils/secureStorage";

export const UserContext = createContext();

// SECURITY: Enhanced user reducer with secure storage integration
export const userReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      // SECURITY: Store user data securely with token separation
      const { token, ...userData } = action.payload;

      // Store token and user data separately for better security
      if (token) {
        SecureStorage.setItem("userToken", token, 8 * 60 * 60 * 1000); // 8 hours
      }

      SecureStorage.setItem("userData", userData, 8 * 60 * 60 * 1000);

      return { user: action.payload };

    case "LOGOUT":
      // SECURITY: Clear all user-related storage
      SecureStorage.removeItem("userToken");
      SecureStorage.removeItem("userData");

      return { user: null };

    case "UPDATE":
      // SECURITY: Update user data while preserving token
      const currentToken = SecureStorage.getItem("userToken");
      const updatedUser = { ...action.payload, token: currentToken };

      SecureStorage.setItem("userData", action.payload, 8 * 60 * 60 * 1000);

      return { user: updatedUser };

    default:
      return state;
  }
};

export const UserContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, {
    user: null,
  });

  useEffect(() => {
    // SECURITY: Use secure storage instead of direct localStorage
    try {
      const userData = SecureStorage.getItem("userData");
      const userToken = SecureStorage.getItem("userToken");

      if (userData && userToken) {
        // Reconstruct user object with token
        const user = { ...userData, token: userToken };
        dispatch({ type: "LOGIN", payload: user });

        console.log(" User session restored from secure storage");
      } else if (userData || userToken) {
        // Partial data found, clean up to prevent inconsistency
        console.warn("Partial user data found, cleaning up for security");
        SecureStorage.removeItem("userData");
        SecureStorage.removeItem("userToken");
      }
    } catch (error) {
      console.error("Error restoring user session:", error.message);
      // Clean up potentially corrupted data
      SecureStorage.removeItem("userData");
      SecureStorage.removeItem("userToken");
    }
  }, []);

  //SECURITY: Enhanced logging without sensitive data
  console.log("UserContext state:", {
    isAuthenticated: !!state.user,
    userId: state.user?.id || "Not logged in",
    hasToken: !!SecureStorage.getItem("userToken"),
  });

  return (
    <UserContext.Provider value={{ ...state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};
