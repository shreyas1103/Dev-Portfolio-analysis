import {
  createContext,
  useContext,
  useReducer,
  useEffect,
} from "react";

import apiClient, {
  setAccessToken,
  setLogoutHandler,
} from "../api/client";

const AuthContext = createContext(undefined);

const initialState = {
  user: null,
  accessToken: null,
  status: "loading",
};

function authReducer(state, action) {
  switch (action.type) {
    case "AUTH_RESTORED":
      return {
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        status: "authenticated",
      };

    case "LOGIN_SUCCESS":
      return {
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        status: "authenticated",
      };

    case "LOGOUT":
      return {
        user: null,
        accessToken: null,
        status: "unauthenticated",
      };

    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(
    authReducer,
    initialState
  );

  async function login(email, password) {
    const res = await apiClient.post(
      "/auth/login",
      {
        email,
        password,
      }
    );

    const {
      user,
      accessToken,
    } = res.data.data;

    setAccessToken(accessToken);

    dispatch({
      type: "LOGIN_SUCCESS",
      payload: {
        user,
        accessToken,
      },
    });
  }

  function logout() {
    setAccessToken(null);

    dispatch({
      type: "LOGOUT",
    });

    apiClient
      .post("/auth/logout")
      .catch(() => {
        // Fire-and-forget:
        // local auth state has already
        // been cleared regardless.
      });
  }

  useEffect(() => {
    setLogoutHandler(logout);

    async function restoreSession() {
      try {
        const refreshRes =
          await apiClient.post(
            "/auth/refresh"
          );

        const { accessToken } =
          refreshRes.data.data;

        setAccessToken(accessToken);

        const meRes =
          await apiClient.get(
            "/auth/me"
          );

        const user = meRes.data.data;

        dispatch({
          type: "AUTH_RESTORED",
          payload: {
            user,
            accessToken,
          },
        });
      } catch {
        dispatch({
          type: "LOGOUT",
        });
      }
    }

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}