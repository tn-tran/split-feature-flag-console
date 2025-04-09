export type TreatmentsWithConfig<K extends string = string> = {
  [P in K]: SplitIO.TreatmentWithConfig;
};

export type TreatmentsWithConfigFromArrayType<
  A extends readonly [...string[]]
> = TreatmentsWithConfig<A[number]>;
