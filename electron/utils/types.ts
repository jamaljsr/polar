export type ValueOf<T> = T[keyof T];

export type IpcMappingFor<
  TChan extends { [x: string]: string },
  TDefaultArgs extends Array<any> = any,
> = Record<ValueOf<TChan>, (...args: TDefaultArgs) => Promise<any>>;
