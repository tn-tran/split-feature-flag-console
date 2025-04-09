import { SplitFactory, SplitFactory as SplitIO } from "@splitsoftware/splitio";
import { SPLIT_AUTHORIZATION_KEY } from "./application/application.config";

const factory: SplitIO.IBrowserSDK = SplitFactory({
  core: {
    authorizationKey: SPLIT_AUTHORIZATION_KEY || "",
    key: (Math.random() + 1).toString(36).substring(7),
  },
  // Optional: Add additional configurations here
  debug: true,
});

export const splitClient = factory.client();
export const splitManager = factory.manager();
