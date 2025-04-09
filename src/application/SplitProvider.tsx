import React from "react";
import {
  ISplitFactoryProviderProps,
  SplitFactoryProvider,
} from "@splitsoftware/splitio-react";
import { sdkConfig } from "./sdkConfig";

export const SplitProvider: React.FC<ISplitFactoryProviderProps> = ({
  children,
  ...rest
}) => {
  return (
    <SplitFactoryProvider config={sdkConfig} {...rest}>
      {children}
    </SplitFactoryProvider>
  );
};
