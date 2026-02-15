"use client";

import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { getDeciveViewport } from "./utils";

type UserAgentInfo = {
  deviceType: "mobile" | "tablet" | "desktop";
  viewport: "sm" | "md" | "lg";
};

const default_value: UserAgentInfo = { deviceType: "desktop", viewport: "lg" };

const UserAgentInfoContext = createContext<UserAgentInfo>(default_value);

const UserAgentInfoContextDispatch = createContext<
  Dispatch<SetStateAction<UserAgentInfo>>
>((i) => i);

export function useUseAgentInfo() {
  return useContext(UserAgentInfoContext);
}

export function useUserAgentDispatch() {
  return useContext(UserAgentInfoContextDispatch);
}

export function UserAgentInfoProvider({
  children,
  deviceType,
}: {
  children: React.ReactNode;
  deviceType: "mobile" | "tablet" | "desktop";
}) {
  const [state, setState] = useState<UserAgentInfo>({
    deviceType: deviceType || default_value.deviceType,
    viewport: getDeciveViewport(deviceType),
  });

  return (
    <UserAgentInfoContext.Provider value={state}>
      <UserAgentInfoContextDispatch.Provider value={setState}>
        {children}
      </UserAgentInfoContextDispatch.Provider>
    </UserAgentInfoContext.Provider>
  );
}
