import {
  useSplitManager,
  useSplitTreatments,
} from "@splitsoftware/splitio-react";
import React, { useEffect, useState } from "react";

// import {
//   useSplitManager,
//   useSplitTreatments,
// } from "@splitsoftware/splitio-react";
import { splitClient, splitManager } from "../splitClient";
// import { splitClient } from "../application";
// import { useAlleTreatments } from "../useAlleTreatment";
// import { useAlleTreatmentOverrides } from "../useAlleTreatmentOverrides";

const featureName = "test_flag";

/**
 * Returns the feature flag registered within the SDK that matches this name.
 *
 * @return SplitView or null.
 */
// const splitView: SplitIO.SplitView = manager.split('name-of-feature-flag');
/**
 * Retrieves all the feature flags that are currently registered within the SDK.
 *
 * returns a List of SplitViews.
 */
// const splitViewsList: SplitIO.SplitViews = manager.splits();
/**
 * Returns the names of all features flags registered within the SDK.
 *
 * @return a List of Strings of the features' names.
 */
// const splitNamesList: SplitIO.SplitNames = manager.names();

const SplitFeatureFlag: React.FC<{ flagName?: string | string }> = ({
  flagName,
}) => {
  // const {
  //   client,
  //   treatments,
  //   isReady,
  //   isReadyFromCache,
  //   hasTimedout,
  //   lastUpdate,
  // } = useSplitTreatments({ names: ["test_flag"] });
  // Make sure the SDK is ready to return Split's data from the manager object

  // Manager is ready to be used.
  const { isReady, treatments } = useSplitTreatments({
    names: [
      "reporting_v2",
      "show_status_bar",
      "billing_updates",
      "test_flag",
      "test_flag2",
    ],
  });

  useEffect(() => {
    // console.log(isReady);
    // console.log("Manager");
    console.log("treatments", treatments);
  }, [isReady]);

  const flagNames = splitManager.names();

  let treatmentResults: SplitIO.Treatments = splitClient.getTreatments([
    "test_flag",
    "test_flag_2",
  ]);
  return (
    <div style={{ marginTop: 24, display: "flex", flexDirection: "column" }}>
      <pre>{`\Feature flags: ${JSON.stringify(
        treatmentResults,
        null,
        2
      )}`}</pre>
      <div>{`${
        isReady ? "SDK ready." : "SDK not ready."
      } Feature flag: test_flag ${treatments["test_flag"].treatment}`}</div>
    </div>
  );
};

export default SplitFeatureFlag;
