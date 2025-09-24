import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUserContext } from "../../../hooks/userContextHook";
import "./styles.css";

const SignIn = ({ navBarProps }) => {
  navBarProps("#E2929D", "#FFF");
  const navigate = useNavigate();

  const { dispatch } = useUserContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [inputValidity, setInputValidity] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    if (email.length !== 0 && password.length >= 8) {
      setInputValidity(true);
    } else {
      setInputValidity(false);
    }
  }, [email, password]);

  // Handle regular login
  const onLoginFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const dataToSend = { email, password };
    try {
      const response = await fetch("http://localhost:4000/api/petOwner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      const json = await response.json();

      if (!response.ok) {
        setError(json.error);
      }
      if (response.ok) {
        // save the user to local storage
        localStorage.setItem("user", JSON.stringify(json));
        dispatch({ type: "LOGIN", payload: json });
        navigate("/pet/home");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth login
  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    setError("");

    try {
      // Open Google OAuth in a new window or redirect current window
      window.location.href = "http://localhost:4000/api/oauth/google";

      //   handleGooglePopup()
    } catch (error) {
      setError("OAuth login failed. Please try again.");
      setOauthLoading(false);
    }
  };

  // Popup window approach
  const handleGooglePopup = () => {
    const width = 500;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    const popup = window.open(
      "http://localhost:4000/api/oauth/google",
      "Google Login",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    // Check for popup closure and handle response
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        setOauthLoading(false);

        checkAuthStatus();
      }
    }, 1000);
  };

  // Check if user is authenticated after OAuth redirect
  const checkAuthStatus = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        // Verify token is still valid
        const response = await fetch(
          "http://localhost:4000/api/petOwner/verifyToken",
          {
            headers: {
              Authorization: `Bearer ${user.userToken}`,
            },
          }
        );

        if (response.ok) {
          dispatch({ type: "LOGIN", payload: user });
          navigate("/pet/home");
        }
      }
    } catch (error) {
      console.log("Auth check failed");
    }
  };

  // Check for OAuth success parameters in URL 
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userParam = urlParams.get("user");

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        const user = {
          ...userData,
          userToken: token,
        };

        // Save to localStorage and context
        localStorage.setItem("user", JSON.stringify(user));
        dispatch({ type: "LOGIN", payload: user });

        // Clean URL and redirect
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        navigate("/pet/home");
      } catch (error) {
        setError("OAuth login failed. Please try again.");
      }
    }
  }, [dispatch, navigate]);

  return (
    <div className="loginPage">
      <div className="loginPageContent">
        <div className="loginHeader">
          <div className="loginHeading">Sign In</div>
          <div className="loginNoAccount">
            <p>Don't have an account?</p>
            <NavLink to="/pet/signup">Sign Up</NavLink>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {/* OAuth Login Section */}
        <div className="oauth-section">
          <button
            type="button"
            className="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={oauthLoading}
          >
            {oauthLoading ? (
              "Signing in with Google..."
            ) : (
              <>
                <svg
                  className="google-icon"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          <div className="divider">
            <span>or</span>
          </div>
        </div>

        {/* Regular Login Form */}
        <form className="loginForm" onSubmit={onLoginFormSubmit}>
          <div className="siginFormInputWrapper">
            <label htmlFor="email">Email </label>
            <input
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="siginFormInputWrapper">
            <label htmlFor="password">Password </label>
            <input
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="signinFormSubmitButtonWrapper">
            {inputValidity ? (
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            ) : (
              <button type="submit" className="disabled" disabled>
                Sign In
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
