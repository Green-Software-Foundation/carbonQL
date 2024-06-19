export type EnvironmentOptions = {
  folderPath: string;
  install: boolean;
  cwd: boolean;
  dependencies: {[path: string]: string};
};

export type PathWithVersion = {[path: string]: string};

export type ManifestPlugin = {[key: string]: {path: string; method: string}};
