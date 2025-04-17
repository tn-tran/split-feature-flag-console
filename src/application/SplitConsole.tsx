import React, {
  useEffect,
  useReducer,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { AddIcon } from "@allergan-data-labs/alle-elements-icons/20/addIcon";
import { FilterOutlineIcon } from "@allergan-data-labs/alle-elements-icons/16/filterOutlineIcon";
import { SearchIcon } from "@allergan-data-labs/alle-elements-icons/20/searchIcon";
import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
} from "@allergan-data-labs/alle-elements-accordion";
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuOptionGroup,
  ActionListItemOption,
} from "@allergan-data-labs/alle-elements-action-menu";
import { IconButton, Button } from "@allergan-data-labs/alle-elements-button";
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
import {
  interceptSplitRequests,
  getStoredOverrides,
  getFirstIntercept,
} from "./handler";
import { SplitFlagManager } from "./splitFlagManager";

// Intercept Split.io requests
interceptSplitRequests();

// Types
type Position =
  | "top"
  | "top-right"
  | "top-left"
  | "bottom"
  | "bottom-right"
  | "bottom-left";
type StatusFilter = "all" | "active" | "killed";
type TreatmentFilter = "all" | "on" | "off" | "custom";
type Treatment = { treatment: string };
type Treatments = Record<string, Treatment>;

// Enums
enum SPLIT_IO_CONSOLE_ACTIONS {
  SET_TREATMENTS = "SET_TREATMENTS",
  MARK_HAS_CHANGES = "MARK_HAS_CHANGES",
  RESET_CHANGES = "RESET_CHANGES",
}

// Interfaces
export interface SplitConsoleProps {
  /**
   * Position of `SplitConsole`
   * @default 'bottom-right'
   */
  position?: Position;
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

interface SplitConsoleState {
  treatments: Treatments;
  hasChanges: boolean;
}

type SplitConsoleAction = {
  type: SPLIT_IO_CONSOLE_ACTIONS;
  payload?: any;
};

// Helper functions
const getPositionStyles = (position: Position, offset: [number, number]) => {
  const [xOffset, yOffset] = offset;

  const basePositions: Record<
    Position,
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

  const basePosition = basePositions[position];

  if (xOffset === 0 && yOffset === 0) {
    return basePosition;
  }

  return {
    ...basePosition,
    top:
      basePosition.top !== undefined
        ? `calc(${basePosition.top}px + ${yOffset}px)`
        : undefined,
    bottom:
      basePosition.bottom !== undefined
        ? `calc(${basePosition.bottom}px - ${yOffset}px)`
        : undefined,
    left:
      basePosition.left !== undefined
        ? `calc(${basePosition.left}px + ${xOffset}px)`
        : undefined,
    right:
      basePosition.right !== undefined
        ? `calc(${basePosition.right}px - ${xOffset}px)`
        : undefined,
  };
};

// Reducer function
const splitConsoleReducer = (
  state: SplitConsoleState,
  action: SplitConsoleAction
): SplitConsoleState => {
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

// Component
export const SplitConsole: React.FC<SplitConsoleProps> = ({
  position = "bottom-right",
  offset = [-24, -24],
  isEnabled = false,
  colorMode: propColorMode,
}) => {
  // Constants
  const PAGE_SIZE = 30;

  // Hooks
  const { colorMode } = useColorMode(propColorMode);
  const { isOpen, onClose, onToggle } = useDisclosure();
  const modalBodyRef = useRef<HTMLDivElement | null>(null);
  const initialTreatmentsRef = useRef<Treatments>({});

  // State
  const [flagManager, setFlagManager] = useState<SplitFlagManager | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [treatmentFilter, setTreatmentFilter] =
    useState<TreatmentFilter>("all");
  const [state, dispatch] = useReducer(splitConsoleReducer, {
    treatments: {},
    hasChanges: false,
  });
  const [displayedItemCount, setDisplayItemCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);

  // Memoized values
  const filteredFlags = useMemo(() => {
    if (!flagManager) return [];
    flagManager.updateSearch(searchTerm, "name");
    flagManager.updateFilter("killed", statusFilter);
    flagManager.updateFilter("treatment", treatmentFilter);
    return flagManager.filterFlags();
  }, [flagManager, searchTerm, statusFilter, treatmentFilter]);

  const displayFlags = useMemo(() => {
    return filteredFlags.slice(0, displayedItemCount);
  }, [filteredFlags, displayedItemCount]);

  const totalFlags = filteredFlags.length;
  const hasMoreFlags = displayedItemCount < totalFlags;

  const overrideCount = Object.entries(getStoredOverrides()).reduce(
    (count, [key, value]: [string, any]) => {
      const initial = initialTreatmentsRef.current[key]?.treatment;
      return initial !== value.treatment ? count + 1 : count;
    },
    0
  );

  const positionStyles = getPositionStyles(position, offset);

  // Effects
  useEffect(() => {
    setDisplayItemCount(PAGE_SIZE);
  }, [searchTerm, statusFilter, treatmentFilter]);

  const handleScroll = useCallback(() => {
    if (!modalBodyRef.current || isLoading || !hasMoreFlags) return;

    const { scrollTop, scrollHeight, clientHeight } = modalBodyRef.current;
    if (scrollHeight - scrollTop - clientHeight < 20) {
      setIsLoading(true);
      setTimeout(() => {
        setDisplayItemCount((prevCount) =>
          Math.min(prevCount + PAGE_SIZE, totalFlags)
        );
        setIsLoading(false);
      }, 300);
    }
  }, [isLoading, hasMoreFlags, totalFlags]);

  useEffect(() => {
    const currentModalBody = modalBodyRef.current;
    if (currentModalBody) {
      currentModalBody.addEventListener("scroll", handleScroll);
    }
    return () => {
      currentModalBody?.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen, handleScroll]);

  useEffect(() => {
    const handleSplitIntercept = (e: Event) => {
      const { response } = (e as CustomEvent).detail;
      if (
        !response?.splits ||
        !Array.isArray(response.splits) ||
        response.splits.length === 0
      ) {
        return;
      }

      setIsLoading(true);

      // Create flag manager immediately with the intercepted data
      const manager = flagManager || new SplitFlagManager(response.splits);
      if (!flagManager) {
        setFlagManager(manager);
        console.log("Flag manager initialized");
      }

      // Process flags from query parameters
      const queryParams = new URLSearchParams(window.location.search);
      const treatmentState: Treatments = {};

      response.splits.forEach((flag: any) => {
        const override = queryParams.get(`ff_${flag.name}`);
        if (override) {
          treatmentState[flag.name] = { treatment: override };
        }
      });

      // Store initial state for reset functionality
      if (Object.keys(initialTreatmentsRef.current).length === 0) {
        initialTreatmentsRef.current = treatmentState;
      }

      // Update state with treatments
      dispatch({
        type: SPLIT_IO_CONSOLE_ACTIONS.SET_TREATMENTS,
        payload: treatmentState,
      });

      setIsLoading(false);
    };

    // Add event listener for split intercepts
    window.addEventListener("split-intercept", handleSplitIntercept);

    //Check for existing cached intercepts on mount
    const cached = getFirstIntercept();
    if (cached) {
      console.log("Processing cached intercept");
      handleSplitIntercept(
        new CustomEvent("split-intercept", { detail: cached })
      );
    }

    return () => {
      window.removeEventListener("split-intercept", handleSplitIntercept);
    };
  }, [flagManager]); // Remove flagManager dependency to avoid re-registering the listener

  const handleTreatmentChange = (flag: string, newTreatment: string) => {
    dispatch({
      type: SPLIT_IO_CONSOLE_ACTIONS.SET_TREATMENTS,
      payload: { ...state.treatments, [flag]: { treatment: newTreatment } },
    });
  };

  const handleReset = () => {
    // TODO:- before saving, reset the override count or set the state.treatments to initialcurrentRef.treatments.
    // if (flagManager) {

    //   flagManager.applyTreatments();
    // }
    console.log(initialTreatmentsRef.current);

    dispatch({
      type: SPLIT_IO_CONSOLE_ACTIONS.SET_TREATMENTS,
      payload: initialTreatmentsRef.current,
    });
  };

  const handleSave = () => {
    // if (flagManager) {
    //   flagManager.applyTreatments(state.treatments);
    // }

    const queryParams = new URLSearchParams(window.location.search);

    Object.entries(state.treatments).forEach(([key, value]) => {
      const treatmentValue = value as Treatment;
      queryParams.set(`ff_${key}`, treatmentValue.treatment);
    });

    const queryString = queryParams.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.replaceState(null, "", newUrl);

    dispatch({ type: SPLIT_IO_CONSOLE_ACTIONS.RESET_CHANGES });
  };

  // Render helpers
  const renderFilters = () => (
    <Box display="flex" gap="8">
      <Input
        colorMode={colorMode}
        leftElement={<SearchIcon />}
        disableInputMask={true}
        placeholder="Search feature flags..."
        onChange={(e) => setSearchTerm(e.target.value)}
        mb={2}
      />
      <ActionMenu
        closeOnSelect={false}
        triggerElement={Button}
        triggerText="Filter"
        triggerElementProps={{
          variant: "outline",
          colorScheme: "action",
          colorMode,
          leftIcon: <FilterOutlineIcon />,
          minWidth: undefined,
        }}
      >
        <ActionMenuContent>
          <ActionMenuOptionGroup type="radio" title="Status">
            <ActionListItemOption
              value="all"
              onClick={() => setStatusFilter("all")}
            >
              All
            </ActionListItemOption>
            <ActionListItemOption
              value="active"
              onClick={() => setStatusFilter("active")}
            >
              Active
            </ActionListItemOption>
            <ActionListItemOption
              value="killed"
              onClick={() => setStatusFilter("killed")}
            >
              Killed
            </ActionListItemOption>
          </ActionMenuOptionGroup>
          <ActionMenuOptionGroup type="radio" title="Treatments">
            <ActionListItemOption
              value="all"
              onClick={() => setTreatmentFilter("all")}
            >
              All
            </ActionListItemOption>
            <ActionListItemOption
              value="on"
              onClick={() => setTreatmentFilter("on")}
            >
              On
            </ActionListItemOption>
            <ActionListItemOption
              value="off"
              onClick={() => setTreatmentFilter("off")}
            >
              Off
            </ActionListItemOption>
            <ActionListItemOption
              value="custom"
              onClick={() => setTreatmentFilter("custom")}
            >
              Custom
            </ActionListItemOption>
          </ActionMenuOptionGroup>
        </ActionMenuContent>
      </ActionMenu>
    </Box>
  );

  const renderFlagDetails = (flag: any) => (
    <Box key={flag.name}>
      <Accordion colorMode={colorMode}>
        <AccordionItem>
          <AccordionButton px={0}>
            <Box flex="1" textAlign="left" mr={4} wordBreak="break-word">
              {flag.name}
            </Box>
            <Box display="flex" gap="8px">
              <Badge
                colorMode={colorMode}
                variant="solid"
                colorScheme={flag.status === "ACTIVE" ? "success" : "alert"}
              >
                {flag.status.charAt(0) + flag.status.slice(1).toLowerCase()}
              </Badge>
              <Badge
                colorMode={colorMode}
                variant="solid"
                colorScheme={
                  flagManager?.getCurrentTreatment(flag) === "on"
                    ? "success"
                    : flagManager?.getCurrentTreatment(flag) === "off"
                    ? "alert"
                    : "warning"
                }
              >
                {flagManager?.getCurrentTreatment(flag)}
              </Badge>
            </Box>
          </AccordionButton>
          <AccordionPanel px={0}>
            {renderFlagInfo(flag)}
            {renderPartitions(flag)}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  );

  const renderFlagInfo = (flag: any) => (
    <Box
      display="grid"
      gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
      border="1px solid"
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
          {flag.trafficType || flag.trafficTypeName || "N/A"}
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
          color={getTreatmentColor(flagManager?.getCurrentTreatment(flag))}
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
              ? getColorToken("Text/Status/Error medium 3", colorMode)
              : getColorToken("Text/Status/Positive medium 3", colorMode)
          }
        >
          {flag.killed ? "Killed" : "Active"}
        </Box>
      </Box>
    </Box>
  );

  const renderPartitions = (flag: any) => (
    <Box
      display="flex"
      flexDir="column"
      border="1px solid"
      borderColor={`${colorMode}.Border/Neutral/Subtle 2`}
      borderRadius={8}
      p={16}
      mb={16}
    >
      <Box {...getTypographyToken("Body/Medium/Medium")} fontWeight="semibold">
        Partition Distribution
      </Box>
      <Box display="flex" gap={6}>
        {flag.conditions?.[0]?.partitions?.map(
          (partition: any, index: number) => (
            <Button
              colorMode={colorMode}
              key={index}
              size="xs"
              variant={
                partition.treatment === state.treatments[flag.name]?.treatment
                  ? "solid"
                  : "outline"
              }
              onClick={() =>
                handleTreatmentChange(flag.name, partition.treatment)
              }
            >
              {partition.treatment} ({partition.size}%)
            </Button>
          )
        )}
      </Box>
    </Box>
  );

  // Helper functions
  const getTreatmentColor = (treatment: string | undefined) => {
    if (!treatment) return "";

    switch (treatment) {
      case "on":
        return getColorToken("Text/Status/Positive medium 3", colorMode);
      case "off":
        return getColorToken("Text/Status/Error medium 3", colorMode);
      default:
        return getColorToken("Text/Status/Warning medium 3", colorMode);
    }
  };

  return (
    <Box>
      <IconButton
        zIndex={100}
        position="fixed"
        {...positionStyles}
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
        isOpen={isOpen}
        onClose={onClose}
        isCentered
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              Feature Flags
              <Box display="flex" alignItems="center" gap={4}>
                {filteredFlags.length > 0 && (
                  <Badge
                    colorMode={colorMode}
                    variant="solid"
                    colorScheme="info"
                  >
                    {filteredFlags.length === 1
                      ? "1 flag found"
                      : `${filteredFlags.length} flags found`}
                  </Badge>
                )}
                <ModalCloseButton />
              </Box>
            </Box>
          </ModalHeader>

          <ModalBody ref={modalBodyRef} onScroll={handleScroll}>
            <Box mb={8}>Override flags for your current session</Box>

            {renderFilters()}

            {filteredFlags.length === 0 ? (
              <Box>No feature flags found matching your filters.</Box>
            ) : (
              displayFlags.map(renderFlagDetails)
            )}

            {isLoading && hasMoreFlags && (
              <Button
                width="100%"
                size="sm"
                isLoading={true}
                colorMode={colorMode}
                colorScheme="action"
                variant="ghost"
              />
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
                Cancel
              </Button>
              <Button
                size="sm"
                colorMode={colorMode}
                onClick={handleReset}
                variant="ghost"
              >
                {/* TODO:- Add circle counter */}
                Clear Overrides
                {overrideCount > 0 && <Box ml={1}>({overrideCount})</Box>}
              </Button>
            </Box>
            <Button size="sm" colorMode={colorMode} onClick={handleSave}>
              Apply
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
