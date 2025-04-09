import React, { ReactNode } from "react";
import { useSplitManager } from "@splitsoftware/splitio-react";
import { Button as ChakraButton } from "@chakra-ui/react";

export const Button = ({ ...rest }) => {
  const { manager, isReady } = useSplitManager();
  if (isReady) {
    // Manager is ready to be used.
    // const flagNames: SplitIO.SplitNames = manager.names();
  }
  return <ChakraButton {...rest} />;
};
