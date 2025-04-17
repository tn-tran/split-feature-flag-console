/* eslint no-use-before-define: 2 */
import React from "react";
import { SplitProvider } from "./application/SplitProvider";
import { SplitConsole } from "./application/SplitConsole";
import SplitFeatureFlag from "./components/SplitFeatureFlag";
import { AddIcon } from "@allergan-data-labs/alle-elements-icons/20/addIcon";

import { AccordionTheme } from "@allergan-data-labs/alle-elements-accordion";
import { AvatarTheme } from "@allergan-data-labs/alle-elements-avatar";
import { BadgeTheme } from "@allergan-data-labs/alle-elements-badge";
import { BreadcrumbTheme } from "@allergan-data-labs/alle-elements-breadcrumb";
import { ButtonTheme } from "@allergan-data-labs/alle-elements-button";
import { CardTheme } from "@allergan-data-labs/alle-elements-card";
import { CheckboxTheme } from "@allergan-data-labs/alle-elements-checkbox";

import {
  FormErrorTheme,
  FormLabelTheme,
  FormTheme,
} from "@allergan-data-labs/alle-elements-form-control";
import { InputTheme } from "@allergan-data-labs/alle-elements-input";
import { LinkTheme } from "@allergan-data-labs/alle-elements-link";
import { ModalTheme } from "@allergan-data-labs/alle-elements-modal";
import { RadioTheme } from "@allergan-data-labs/alle-elements-radio";
import { SwitchTheme } from "@allergan-data-labs/alle-elements-switch";
import { TooltipTheme } from "@allergan-data-labs/alle-elements-tooltip";
import { TabsTheme } from "@allergan-data-labs/alle-elements-tabs";
import { SelectTheme } from "@allergan-data-labs/alle-elements-select";

// import { DeleteIcon } from "@allergan-data-labs/alle-elements-icons/20/deleteIcon";
// import { EmailIcon } from "@allergan-data-labs/alle-elements-icons/20/emailIcon";
import {
  Box,
  ChakraProvider,
  IconButton,
  SlideFade,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { Button } from "./Button";

import {
  BrowserRouter as Router,
  Route,
  Switch,
  useLocation,
  useHistory,
} from "react-router-dom";
import { AlleElementsProvider } from "@allergan-data-labs/alle-elements-core";
import { useSplitTreatments } from "@splitsoftware/splitio-react";

const componentThemes = {
  // please keep alphabetical
  Accordion: AccordionTheme,
  Avatar: AvatarTheme,
  Badge: BadgeTheme,
  Breadcrumb: BreadcrumbTheme,
  Button: ButtonTheme,
  Card: CardTheme,
  Checkbox: CheckboxTheme,
  Form: FormTheme,
  FormLabel: FormLabelTheme,
  FormError: FormErrorTheme,
  Input: InputTheme,
  Link: LinkTheme,
  Modal: ModalTheme,
  Radio: RadioTheme,
  Select: SelectTheme,
  Switch: SwitchTheme,
  Tabs: TabsTheme,
  Tooltip: TooltipTheme,
};

// import { interceptSplitRequests } from "./application/handler";
function App() {
  return (
    <AlleElementsProvider componentTheme={componentThemes}>
      <Box w={"100vw"} h="100vh">
        <Router basename="/">
          <Box>
            <Switch>
              <Route
                component={() => {
                  return (
                    <Box h="100vh">
                      <SplitProvider>
                        <SplitConsole isEnabled={true} />
                        <SplitFeatureFlag />
                      </SplitProvider>
                    </Box>
                  );
                }}
              />
            </Switch>
          </Box>
        </Router>
      </Box>
    </AlleElementsProvider>
  );
}

export default App;
