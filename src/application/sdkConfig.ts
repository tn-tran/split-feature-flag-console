import { SplitFactory } from "@splitsoftware/splitio-react";
import {
  SPLIT_AUTHORIZATION_KEY,
  SPLIT_DEBUGGER_ENABLED,
} from "./application.config";
import { getSplitKey } from "./getSplitKey/getSplitKey";

export const sdkConfig: SplitIO.IBrowserSettings = {
  core: {
    authorizationKey: SPLIT_AUTHORIZATION_KEY || "",
    key: getSplitKey(SPLIT_DEBUGGER_ENABLED),
  },
  // features: {
  //   reporting_v2: "on", // example with just a string value for the treatment
  //   billing_updates: { treatment: "visa", config: '{ "color": "blue" }' }, // example of a defined config
  //   show_status_bar: { treatment: "off", config: null }, // example of a null config
  // },
};

export const factory: SplitIO.IBrowserSDK = SplitFactory({ ...sdkConfig });
export const splitClient = factory.client();
