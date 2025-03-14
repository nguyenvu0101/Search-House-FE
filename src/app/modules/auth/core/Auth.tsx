import {FC, useState, useEffect, createContext, useContext, useRef, Dispatch, SetStateAction} from 'react';
import {LayoutSplashScreen} from '../../../../_metronic/layout/core';
import {AuthModel, UserModel, PermissionsModel} from './_models';
import * as authHelper from './AuthHelpers';
import {getUserByToken, getCurrentPermissions} from './_requests';
import {WithChildren} from '../../../../_metronic/helpers';

type AuthContextProps = {
  auth: AuthModel | undefined;
  saveAuth: (auth: AuthModel | undefined) => void;
  currentUser: UserModel | undefined;
  setCurrentUser: Dispatch<SetStateAction<UserModel | undefined>>;
  currentPermissions: PermissionsModel | undefined;
  setCurrentPermissions: Dispatch<SetStateAction<PermissionsModel | undefined>>;
  logout: () => void;
};

const initAuthContextPropsState = {
  auth: authHelper.getAuth(),
  saveAuth: () => {},
  currentUser: undefined,
  setCurrentUser: () => {},
  currentPermissions: undefined,
  setCurrentPermissions: () => {},
  logout: () => {},
};

const AuthContext = createContext<AuthContextProps>(initAuthContextPropsState);

const useAuth = () => {
  return useContext(AuthContext);
};

const AuthProvider: FC<WithChildren> = ({children}) => {
  const [auth, setAuth] = useState<AuthModel | undefined>(authHelper.getAuth());
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>();
  const [currentPermissions, setCurrentPermissions] = useState<PermissionsModel | undefined>();
  const saveAuth = (auth: AuthModel | undefined) => {
    setAuth(auth);
    if (auth) {
      authHelper.setAuth(auth);
    } else {
      authHelper.removeAuth();
    }
  };

  const logout = () => {
    saveAuth(undefined);
    setCurrentUser(undefined);
    setCurrentPermissions(undefined);
  };

  return (
    <AuthContext.Provider value={{auth, saveAuth, currentUser, setCurrentUser, currentPermissions, setCurrentPermissions, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

const AuthInit: FC<WithChildren> = ({children}) => {
  const {auth, logout, setCurrentUser, setCurrentPermissions} = useAuth();
  const didRequest = useRef(false);
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  // We should request user by authToken (IN OUR EXAMPLE IT'S API_TOKEN) before rendering the application
  useEffect(() => {
    const requestUser = async (apiToken: string) => {
      try {
        if (!didRequest.current) {
          const {data} = await getUserByToken(apiToken);
          if (data) {
            setCurrentUser(data);
          }
        }
      } catch (error) {
        console.error(error);
        if (!didRequest.current) {
          logout();
        }
      } finally {
        setShowSplashScreen(false);
      }

      return () => (didRequest.current = true);
    };

    const requestPermissions = async (apiToken: string) => {
      try {
        if (!didRequest.current) {
          const {data} = await getCurrentPermissions();
          if (data) {
            setCurrentPermissions(data);
          }
        }
      } catch (error) {
        console.error(error);
        if (!didRequest.current) {
          logout();
        }
      } finally {
        setShowSplashScreen(false);
      }

      return () => (didRequest.current = true);
    };

    if (auth && auth.token) {
      requestUser(auth.token);
      requestPermissions(auth.token);
    } else {
      logout();
      setShowSplashScreen(false);
    }
    // eslint-disable-next-line
  }, []);

  return showSplashScreen ? <LayoutSplashScreen /> : <>{children}</>;
};

export {AuthProvider, AuthInit, useAuth};
