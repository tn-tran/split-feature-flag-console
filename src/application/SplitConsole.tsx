import React, { useEffect, useRef, useReducer, useState } from "react";
import { AddIcon } from "@allergan-data-labs/alle-elements-icons/20/addIcon";
import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
} from "@allergan-data-labs/alle-elements-accordion";
import { IconButton, Button } from "@allergan-data-labs/alle-elements-button";
import { SearchIcon } from "@allergan-data-labs/alle-elements-icons/20/searchIcon";
import { Badge } from "@allergan-data-labs/alle-elements-badge";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@allergan-data-labs/alle-elements-modal";
import { Box, useDisclosure } from "@chakra-ui/react";
import {
  ColorMode,
  useColorMode,
  getTypographyToken,
  getColorToken,
} from "@allergan-data-labs/alle-elements-core";
import { Input } from "@allergan-data-labs/alle-elements-input";

import { interceptSplitRequests } from "./handler";
import { SplitFlagManager } from "./splitFlagManager";

interceptSplitRequests();

export enum SPLIT_IO_CONSOLE_ACTIONS {
  SET_TREATMENTS = "SET_TREATMENTS",
  MARK_HAS_CHANGES = "MARK_HAS_CHANGES",
  RESET_CHANGES = "RESET_CHANGES",
}

const splitConsoleReducer = (
  state: {
    treatments: Record<string, { treatment: string }>;
    hasChanges: boolean;
  },
  action: { type: SPLIT_IO_CONSOLE_ACTIONS; payload?: any }
) => {
  switch (action.type) {
    case SPLIT_IO_CONSOLE_ACTIONS.SET_TREATMENTS:
      return { ...state, treatments: action.payload, hasChanges: true };
    case SPLIT_IO_CONSOLE_ACTIONS.MARK_HAS_CHANGES:
      return { ...state, hasChanges: true };
    case SPLIT_IO_CONSOLE_ACTIONS.RESET_CHANGES:
      return { ...state, hasChanges: false };
    default:
      throw new Error(
        `Unhandled SPLIT_IO_CONSOLE_ACTIONS type: ${action.type}`
      );
  }
};

export interface SplitConsoleProps {
  /**
   * Position of `SplitConsole`
   * @default 'bottom-right'
   */
  position?:
    | "top"
    | "top-right"
    | "top-left"
    | "bottom"
    | "bottom-right"
    | "bottom-left";
  /**
   * Offset position of `SplitConsole`
   * @default ['-10', '-10']
   */
  offset?: [number, number];
  children?: React.ReactNode;
  /**
   * Enable or disable the `SplitConsole`, this set the button isLoading state.
   * @default false
   */
  isEnabled?: boolean;
  /**
   * Colormode for `SplitConsole`
   * @default 'light'
   */
  colorMode?: ColorMode;
}

export const SplitConsole = ({
  position = "bottom-right",
  offset = [-24, -24],
  isEnabled = false,
  colorMode: propColorMode,
}: SplitConsoleProps) => {
  const { colorMode } = useColorMode(propColorMode);
  const { isOpen, onOpen, onClose, onToggle } = useDisclosure();
  const [flagManager, setFlagManager] = useState<SplitFlagManager | null>();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "killed">(
    "all"
  );
  const [treatmentFilter, setTreatmentFilter] = useState<
    "all" | "on" | "off" | "custom"
  >("all");
  const filteredFlags = (() => {
    if (!flagManager) return [];
    flagManager.updateSearch(searchTerm, "name");
    flagManager.updateFilter("killed", statusFilter);
    flagManager.updateFilter("treatment", treatmentFilter);

    return flagManager.filterFlags();
  })();
  const [state, dispatch] = useReducer(splitConsoleReducer, {
    treatments: {},
    hasChanges: false,
  } as any);
  const initialTreatmentsRef = React.useRef<
    Record<string, { treatment: string }>
  >({});
  const overrideCount = Object.entries(state.treatments).reduce(
    (count, [key, value]: [string, any]) => {
      const initial = initialTreatmentsRef.current[key]?.treatment;
      if (initial !== value.treatment) {
        return count + 1;
      }
      return count;
    },
    0
  );

  const [xOffset, yOffset] = offset;
  const positionStyles: Record<
    string,
    {
      top?: string | number;
      bottom?: string | number;
      left?: string | number;
      right?: string | number;
      transform?: string;
    }
  > = {
    top: { top: 0, left: "50%", transform: "translateX(-50%)" },
    "top-right": { top: 0, right: 0 },
    "top-left": { top: 0, left: 0 },
    bottom: { bottom: 0, left: "50%", transform: "translateX(-50%)" },
    "bottom-right": { bottom: 0, right: 0 },
    "bottom-left": { bottom: 0, left: 0 },
  };
  const currentPositionStyles = {
    ...positionStyles[position],
    ...(xOffset !== 0 || yOffset !== 0
      ? {
          top:
            positionStyles[position].top !== undefined
              ? `calc(${positionStyles[position].top}px + ${yOffset}px)`
              : undefined,
          bottom:
            positionStyles[position].bottom !== undefined
              ? `calc(${positionStyles[position].bottom}px - ${yOffset}px)`
              : undefined,
          left:
            positionStyles[position].left !== undefined
              ? `calc(${positionStyles[position].left}px + ${xOffset}px)`
              : undefined,
          right:
            positionStyles[position].right !== undefined
              ? `calc(${positionStyles[position].right}px - ${xOffset}px)`
              : undefined,
        }
      : {}),
  };

  useEffect(() => {
    if (flagManager) return;

    const handler = (e: Event) => {
      const { response } = (e as CustomEvent).detail;
      if (
        response?.splits &&
        Array.isArray(response.splits) &&
        response.splits.length !== 0
      ) {
        if (flagManager) return;
        const manager = new SplitFlagManager(response.splits);
        setFlagManager(manager);

        const queryParams = new URLSearchParams(window.location.search);
        const treatmentState: Record<string, any> = {};

        response.splits.forEach((flag: any) => {
          const override = queryParams.get(`ff_${flag.name}`);
          if (override) {
            treatmentState[flag.name] = { treatment: override };
          }
        });

        initialTreatmentsRef.current = treatmentState;

        dispatch({
          type: SPLIT_IO_CONSOLE_ACTIONS.SET_TREATMENTS,
          payload: treatmentState,
        });
      }
    };

    window.addEventListener("split-intercept", handler);
    return () => {
      window.removeEventListener("split-intercept", handler);
    };
  }, []);

  const handleTreatmentChange = (flag: string, newTreatment: string) => {
    dispatch({
      type: SPLIT_IO_CONSOLE_ACTIONS.SET_TREATMENTS,
      payload: { ...state.treatments, [flag]: { treatment: newTreatment } },
    });
  };

  const handleReset = () => {
    dispatch({
      type: SPLIT_IO_CONSOLE_ACTIONS.SET_TREATMENTS,
      payload: initialTreatmentsRef.current,
    });
  };

  const handleSave = () => {
    if (flagManager) {
      flagManager.applyTreatments(state.treatments);
      console.log(state.treatments);
    }
    const queryParams = new URLSearchParams(window.location.search);

    Object.entries(state.treatments).forEach(([key, value]) => {
      const treatmentValue = value as { treatment: string };
      queryParams.set(`ff_${key}`, treatmentValue.treatment);
    });

    const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
    window.history.replaceState(null, "", newUrl);

    // window.location.reload();
    dispatch({ type: SPLIT_IO_CONSOLE_ACTIONS.RESET_CHANGES });
  };

  return (
    <Box>
      <IconButton
        position="absolute"
        {...currentPositionStyles}
        size="xs"
        colorMode={colorMode}
        aria-label="add-split-console-icon"
        onClick={onToggle}
        icon={<AddIcon />}
        isLoading={!isEnabled}
      />

      <Modal
        colorMode={colorMode}
        size="md"
        isOpen={true}
        onClose={onClose}
        isCentered
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Box>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                Feature Flags
                <Box display="flex" alignItems="center" gap={4}>
                  {filteredFlags && (
                    <Badge
                      colorMode={colorMode}
                      variant="solid"
                      colorScheme="info"
                    >
                      {filteredFlags?.length === 1
                        ? "1 flag found"
                        : `${filteredFlags?.length} flags found`}
                    </Badge>
                  )}
                  <ModalCloseButton />
                </Box>
              </Box>
            </Box>
          </ModalHeader>

          <ModalBody>
            <Box mb={8}>Override flags for your current session</Box>
            <Input
              colorMode={colorMode}
              leftElement={<SearchIcon />}
              disableInputMask={true}
              placeholder="Search feature flags..."
              onChange={(e) => setSearchTerm(e.target.value)}
              mb={2}
            />

            <Box>
              <Accordion colorMode={colorMode} defaultIndex={[0]}>
                <AccordionItem>
                  <AccordionButton px={0}>
                    <Box flex="1" textAlign="left">
                      Filters
                    </Box>
                  </AccordionButton>
                  <AccordionPanel px={0}>
                    <Box
                      display="flex"
                      flexDir="column"
                      border={"1px solid"}
                      borderColor={`${colorMode}.Border/Neutral/Subtle 2`}
                      borderRadius={8}
                      p={16}
                      mb={16}
                    >
                      <Box mb={2}>Status</Box>
                      <Box display="flex" flexDir="row" gap={8}>
                        {["all", "active", "killed"].map((s) => (
                          <Button
                            key={s}
                            size="xs"
                            variant={statusFilter === s ? "solid" : "outline"}
                            onClick={() =>
                              setStatusFilter(s as typeof statusFilter)
                            }
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </Button>
                        ))}
                      </Box>

                      <Box mt={12}>
                        <Box mb={1}>Treatments</Box>
                        <Box display="flex" flexDir="row" gap={8}>
                          {["all", "on", "off", "custom"].map((t) => (
                            <Button
                              key={t}
                              size="xs"
                              variant={
                                treatmentFilter === t ? "solid" : "outline"
                              }
                              onClick={() =>
                                setTreatmentFilter(t as typeof treatmentFilter)
                              }
                              mr={2}
                            >
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>

            {filteredFlags?.length === 0 ? (
              <Box>No feature flags found matching your filters.</Box>
            ) : (
              filteredFlags?.map((flag) => (
                <Box key={flag.name}>
                  <Accordion colorMode={colorMode}>
                    <AccordionItem>
                      <AccordionButton px={0}>
                        <Box
                          flex="1"
                          textAlign="left"
                          mr={4}
                          wordBreak="break-word"
                        >
                          {flag.name}
                        </Box>
                        <Box display="flex" gap="8px">
                          <Badge
                            colorMode={colorMode}
                            variant="solid"
                            colorScheme={
                              flag.status === "ACTIVE" ? "success" : "alert"
                            }
                          >
                            {flag.status.charAt(0) +
                              flag.status.slice(1).toLowerCase()}
                          </Badge>
                          <Badge
                            colorMode={colorMode}
                            variant="solid"
                            colorScheme={
                              flagManager?.getCurrentTreatment(flag) === "on"
                                ? "success"
                                : flagManager?.getCurrentTreatment(flag) ===
                                  "off"
                                ? "alert"
                                : "warning"
                            }
                          >
                            {flagManager?.getCurrentTreatment(flag)}
                          </Badge>
                        </Box>
                      </AccordionButton>
                      <AccordionPanel px={0}>
                        <Box
                          display={"grid"}
                          gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
                          border={"1px solid"}
                          borderColor={`${colorMode}.Border/Neutral/Subtle 2`}
                          borderRadius={8}
                          p={16}
                          mb={16}
                        >
                          <Box>
                            <Box
                              {...getTypographyToken("Body/Medium/Medium")}
                              fontWeight="semibold"
                            >
                              Traffic Type
                            </Box>
                            <Box {...getTypographyToken("Body/Small/Regular")}>
                              {flag.trafficType ||
                                flag.trafficTypeName ||
                                "N/A"}
                            </Box>
                          </Box>
                          <Box>
                            <Box
                              {...getTypographyToken("Body/Medium/Medium")}
                              fontWeight="semibold"
                            >
                              Default Treatment
                            </Box>
                            <Box {...getTypographyToken("Body/Small/Regular")}>
                              {flag.defaultTreatment}
                            </Box>
                          </Box>
                          <Box>
                            <Box
                              {...getTypographyToken("Body/Medium/Medium")}
                              fontWeight="semibold"
                            >
                              Current Treatment
                            </Box>
                            <Box
                              {...getTypographyToken("Body/Small/Regular")}
                              color={
                                flagManager?.getCurrentTreatment(flag) === "on"
                                  ? getColorToken(
                                      "Text/Status/Positive medium 3",
                                      colorMode
                                    )
                                  : flagManager?.getCurrentTreatment(flag) ===
                                    "off"
                                  ? getColorToken(
                                      "Text/Status/Error medium 3",
                                      colorMode
                                    )
                                  : getColorToken(
                                      "Text/Status/Warning medium 3",
                                      colorMode
                                    )
                              }
                            >
                              {flagManager?.getCurrentTreatment(flag)}
                            </Box>
                          </Box>
                          <Box>
                            <Box
                              {...getTypographyToken("Body/Medium/Medium")}
                              fontWeight="semibold"
                            >
                              Status
                            </Box>
                            <Box
                              {...getTypographyToken("Body/Small/Regular")}
                              color={
                                flag.killed
                                  ? getColorToken(
                                      "Text/Status/Error medium 3",
                                      colorMode
                                    )
                                  : getColorToken(
                                      "Text/Status/Positive medium 3",
                                      colorMode
                                    )
                              }
                            >
                              {flag.killed ? "Killed" : "Active"}
                            </Box>
                          </Box>
                        </Box>
                        <Box
                          display="flex"
                          flexDir="column"
                          border={"1px solid"}
                          borderColor={`${colorMode}.Border/Neutral/Subtle 2`}
                          borderRadius={8}
                          p={16}
                          mb={16}
                        >
                          <Box
                            {...getTypographyToken("Body/Medium/Medium")}
                            fontWeight="semibold"
                          >
                            Partition Distribution
                          </Box>
                          <Box display="flex" gap={6}>
                            {flag.conditions?.[0]?.partitions?.map(
                              (partition, index) => (
                                <Button
                                  colorMode={colorMode}
                                  key={index}
                                  size="xs"
                                  variant={
                                    partition.treatment ===
                                    state.treatments[flag.name]?.treatment
                                      ? "solid"
                                      : "outline"
                                  }
                                  onClick={() =>
                                    handleTreatmentChange(
                                      flag.name,
                                      partition.treatment
                                    )
                                  }
                                >
                                  {partition.treatment} ({partition.size}%)
                                </Button>
                              )
                            )}
                          </Box>
                        </Box>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Box>
              ))
            )}
          </ModalBody>
          <ModalFooter borderRadius={8}>
            <Box w="100%" h="100%">
              <Button
                size="sm"
                colorMode={colorMode}
                mr={3}
                onClick={onClose}
                variant="outline"
              >
                Close
              </Button>
              <Button
                size="sm"
                colorMode={colorMode}
                onClick={handleReset}
                variant="outline"
              >
                Reset
                {overrideCount > 0 && <Box ml={1}>({overrideCount})</Box>}
              </Button>
            </Box>
            <Button size="sm" colorMode={colorMode} onClick={handleSave}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
