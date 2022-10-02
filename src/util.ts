import postcss from 'postcss';
import postcssModules from 'postcss-modules';
import { ModuleNode, Update } from 'vite';
export interface CSSModulesOptions {
  scopeBehaviour?: 'global' | 'local';
  globalModulePaths?: RegExp[];
  generateScopedName: string | ((name: string, filename: string, css: string) => string);
  hashPrefix?: string;
  localsConvention?: 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly' | null;
}

export interface oneOfModulesType {
  test: RegExp;
  modules?: CSSModulesOptions;
  plugins?: any[];
}
export const isCssModule = (fileUrl: string, list: any[]): oneOfModulesType | void => {
  if (Array.isArray(list) && list.length) {
    const item = list.find((el) => el.test.test(fileUrl));
    return item;
  }
};

type compileCSSResult = {
  ast: any;
  modules: Record<string, any>;
  code: string;
  messages: any[];
};
export const compileCSS = async (
  id: string,
  code: string,
  moduleOption?: Record<string, any>,
  modulePlugins?: any[]
): Promise<compileCSSResult> => {
  let modules;
  let postcssPlugins = [...(modulePlugins ? modulePlugins : [])];
  postcssPlugins.unshift(
    postcssModules({
      ...(moduleOption ? moduleOption : {}),
      getJSON(cssFileName: string, _modules: Record<string, any>, outputFileName: string) {
        modules = _modules;
        if (moduleOption && typeof moduleOption.getJSON === 'function') {
          moduleOption.getJSON(cssFileName, _modules, outputFileName);
        }
      },
    })
  );

  const postcssResult = await postcss(postcssPlugins).process(code, {
    to: id,
    from: id,
    map: {
      inline: false,
      annotation: false,
    },
  });
  return {
    ast: postcssResult,
    modules: modules ? modules : {},
    code: postcssResult.css,
    messages: postcssResult.messages,
  };
};

export const getUpdateList = (modules: Set<ModuleNode> | ModuleNode[]) => {
  const jsFileReg = /(.jsx?|.tsx?)$/;
  const updates: Update[] = [];
  const loopFn = (modules: Set<ModuleNode> | ModuleNode[]) => {
    modules &&
      modules.forEach((module: ModuleNode) => {
        const fileUrl = module.url;
        if (jsFileReg.test(fileUrl)) {
          updates.push({
            type: `js-update`,
            timestamp: new Date().getTime(),
            path: fileUrl,
            acceptedPath: fileUrl,
          });
          return;
        }
        module.importers &&
          module.importers.forEach((ModuleNode: ModuleNode) => {
            const fileUrl = ModuleNode.url;
            if (jsFileReg.test(fileUrl)) {
              updates.push({
                type: `js-update`,
                timestamp: new Date().getTime(),
                path: ModuleNode.url,
                acceptedPath: ModuleNode.url,
              });
            } else {
              loopFn(ModuleNode.importers);
            }
          });
      });
  };
  loopFn(modules);
  return updates;
};
