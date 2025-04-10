export interface SplitFlag {
  name: string;
  status: "ACTIVE" | "KILLED";
  killed?: boolean;
  defaultTreatment?: string;
  trafficType?: string;
  trafficTypeName?: string;
  configurations?: Record<string, any>;
  treatments: string[];
  conditions?: Array<{
    partitions: Array<{
      treatment: string;
      size: number;
    }>;
  }>;
}

export class SplitFlagManager {
  private splits: SplitFlag[] = [];
  private searchQuery: string = "";
  private searchField: "name" | "trafficType" | "all" = "name";
  private filters = {
    killed: "all" as "all" | "active" | "killed",
    treatment: "all" as "all" | "on" | "off" | "custom",
  };

  constructor(splitData: SplitFlag[]) {
    this.splits = splitData || [];
  }

  getAllFlags(): SplitFlag[] {
    return this.splits;
  }

  updateFilter(type: keyof typeof this.filters, value: any) {
    this.filters[type] = value;
  }

  updateSearch(query: string, field: typeof this.searchField) {
    this.searchQuery = query;
    this.searchField = field;
  }

  applyTreatments(treatments: Record<string, { treatment: string }>) {
    this.splits.forEach((flag) => {
      const override = treatments[flag.name];
      if (override) {
        (flag as any).__overrideTreatment = override.treatment;
      }
    });
  }

  updateTreatment(flagName: string, treatment: string) {
    const flagIndex = this.splits.findIndex((flag) => flag.name === flagName);
    if (flagIndex >= 0) {
    }
  }

  fuzzyMatch(text: string, searchValue: string): boolean {
    if (!text || !searchValue) return false;
    text = text.toLowerCase();
    searchValue = searchValue.toLowerCase();

    const parts = searchValue.split(/[\s_-]+/).filter(Boolean);
    return parts.every((part) => text.includes(part));
  }

  searchInField(flag: SplitFlag, query: string): boolean {
    const value = query.toLowerCase();
    switch (this.searchField) {
      case "name":
        return this.fuzzyMatch(flag.name, value);
      case "trafficType":
        return this.fuzzyMatch(
          flag.trafficType || flag.trafficTypeName || "",
          value
        );
      case "all":
        return this.fuzzyMatch(
          [
            flag.name,
            flag.trafficType || flag.trafficTypeName || "",
            flag.defaultTreatment || "",
            flag.killed ? "killed" : "active",
            flag.configurations ? JSON.stringify(flag.configurations) : "",
          ].join(" "),
          value
        );
      default:
        return false;
    }
  }

  getCurrentTreatment(flag: SplitFlag): string {
    const override = (flag as any).__overrideTreatment;
    if (override) return override;

    if (flag.killed || flag.status !== "ACTIVE") return "killed";

    const fullPartition = flag.conditions?.[0]?.partitions?.find(
      (p) => p.size === 100
    );

    return fullPartition?.treatment || flag.defaultTreatment || "custom";
  }

  getTreatmentClass(treatment: string): string {
    return treatment === "on" || treatment === "off" ? treatment : "custom";
  }

  getTreatments(flag: SplitFlag): string[] {
    if (!flag.conditions?.[0]?.partitions) return [];

    return flag.conditions[0].partitions.map((p) => p.treatment);
  }

  filterFlags(): SplitFlag[] {
    return this.splits
      .filter((flag) => {
        if (!this.searchQuery) return true;
        return this.searchInField(flag, this.searchQuery);
      })
      .filter((flag) => {
        if (this.filters.killed === "all") return true;
        const isKilled = flag.killed === true;
        return this.filters.killed === "active" ? !isKilled : isKilled;
      })
      .filter((flag) => {
        if (this.filters.treatment === "all") return true;
        const currentTreatment = this.getCurrentTreatment(flag);
        if (this.filters.treatment === "custom") {
          return !["on", "off", "killed"].includes(currentTreatment);
        }
        return currentTreatment === this.filters.treatment;
      });
  }
}
