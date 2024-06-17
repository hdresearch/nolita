import { ObjectiveState } from "../types/browser/objectiveState.types";
import { ModelResponseType as ModelResponse } from "../types/browser/actionStep.types";

export const objectiveStateExample1: ObjectiveState = {
  kind: "ObjectiveState",
  objective: "how much is an gadget 11 pro",
  progress: [],
  url: "https://www.google.com/",
  contentMode: "aria",
  content: `[0,"RootWebArea","Google",[[1,"link","Gmail"],[2,"link","Images"],[3,"button","Google apps"],[4,"link","Sign in"],["img","Google"],[5,"combobox","Search"]]]`,
};

export const actionStepExample1: ModelResponse = {
  progressAssessment:
    "Do not have enough information in ariaTree to return an Objective Result.",
  command: [
    {
      kind: "Type",
      index: 5,
      text: "gadget 11 pro price",
    },
  ],
  description: "Searched `gadget 11 pro price`",
};

export const objectiveStateExample2: ObjectiveState = {
  kind: "ObjectiveState",
  objective: "Who was president when Early Voting won Preakness Stakes",
  progress: ["Searched `early voting Preakness Stakes win`"],
  url: "https://www.google.com/search",
  contentMode: "aria",
  content: `[0, "RootWebArea", "early voting Preakness Stakes win - Google Search", [[1, "heading", "Accessibility Links"],[2, "link", "Skip to main content"],[3, "link", "Switch to page by page results"],[4, "link", "Accessibility help"],[5, "link", "Accessibility feedback"],[6, "link", "Google"],[7, "combobox", "Search", ["early voting Preakness Stakes win"]],[8, "button", "Clear"],[9, "button", "Search by voice"],[10, "button", "Search by image"],[11, "button", "Search"],[12, "button", "Settings"],[13, "button", "Google apps"],[14, "link", "Sign in"],[15, "heading", "Search Modes", ["All",[16, "link", "News"],[17, "link", "Images"],[18, "link", "Shopping"],[19, "link", "Videos"],[20, "button", "More"],[21, "button", "Tools"]]],"About 166,000 results", " (0.39 seconds) ",[22, "heading", "Search Results"],[23, "heading", "Featured snippet from the web"],[24, "button", "Image result for early voting Preakness Stakes win"],[25, "heading", "Early Voting, a colt owned by the billionaire hedge fund investor Seth Klarman, repelled the challenge of the heavily favored Epicenter to capture the 147th running of the Preakness Stakes.May 21, 2022"],[26, "link", "Early Voting Wins Preakness Stakes - The New York Times https://www.nytimes.com › Sports › Horse Racing"],[27, "button", "About this result"]]]`,
};

export const actionStepExample2: ModelResponse = {
  progressAssessment:
    "Per search results in ariaTree: Early Voting won Preakness Stakes in 2022. Do not have enough information to return objective result. Now need to find out who was president in 2022",
  command: [{ kind: "Type", index: 7, text: "2022 president" }],
  description:
    "Early Voting won Preakness Stakes on `May 21, 2022`. This is a partial answer to `early voting Preakness Stakes win` so searched `2022 president`",
};

export const stateActionPair1 = {
  objectiveState: objectiveStateExample1,
  actionStep: actionStepExample1,
};

export const stateActionPair2 = {
  objectiveState: objectiveStateExample2,
  actionStep: actionStepExample2,
};

export const DEFAULT_STATE_ACTION_PAIRS = [stateActionPair1, stateActionPair2];
