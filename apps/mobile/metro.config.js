const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo support: let Metro watch and resolve the whole workspace.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

// Workspace packages export TypeScript source directly (main/types point to
// .ts files). Their internal imports use ESM-convention .js extensions (e.g.
// `export * from "./reducer.js"`) which Metro can't resolve because the real
// files are .ts. The custom resolver falls back from .js → .ts so Metro finds
// the source files in packages/*.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = originalResolveRequest ?? context.resolveRequest;
  try {
    return resolve(context, moduleName, platform);
  } catch (err) {
    if (moduleName.endsWith(".js")) {
      try {
        return resolve(context, moduleName.slice(0, -3) + ".ts", platform);
      } catch {
        // ignore, fall through to rethrow original error
      }
      try {
        return resolve(context, moduleName.slice(0, -3) + ".tsx", platform);
      } catch {
        // ignore
      }
    }
    throw err;
  }
};

module.exports = config;
