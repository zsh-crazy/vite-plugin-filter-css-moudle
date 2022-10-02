import { dataToEsm } from '@rollup/pluginutils';
import { Alias, AppType, BuildOptions, DepOptimizationOptions, ExperimentalOptions, InlineConfig, InternalResolveOptions, Logger, Plugin, PluginHookUtils, ResolvedPreviewOptions, ResolvedServerOptions, ResolvedSSROptions, ResolveFn, ResolveOptions, ResolveWorkerOptions, UserConfig } from 'vite';
import { isCssModule, compileCSS, oneOfModulesType, getUpdateList } from './util';
let moduleJsonMap: Map<string, { moduleJsonCode: string; cssCode: string }> = new Map();
const vitePluginTransformFilterCssModulePre = (options: oneOfModulesType[]) => {
  let config: UserConfig;
  return {
    name: 'vite-plugin-transform-filter-css-module-pre',
    configResolved(resolvedConfig: UserConfig) {
      config = resolvedConfig;
    },

    async transform(raw: any, id: any) {
      const file = id.split("?")[0];
      const itemOption = isCssModule(file, options);
      if (!itemOption) {
        return;
      }
      let { code: css, modules } = await compileCSS(file, raw, itemOption.modules, itemOption.plugins);
      const modulesCode =
        modules &&
        dataToEsm(modules, {
          namedExports: true,
          preferConst: true,
        });
      moduleJsonMap.set(file, { moduleJsonCode: modulesCode, cssCode: css });
      return {
        code: css,
      };
    },
  };
};

const vitePluginTransformFilterCssModulePost = (options: oneOfModulesType[]): Plugin => {
  let config: Readonly<Omit<UserConfig, "plugins" | "assetsInclude" | "optimizeDeps" | "worker"> & { configFile: string | undefined; configFileDependencies: string[]; inlineConfig: InlineConfig; root: string; base: string; publicDir: string; cacheDir: string; command: "build" | "serve"; mode: string; isWorker: boolean; isProduction: boolean; env: Record<string, any>; resolve: ResolveOptions & { alias: Alias[]; }; plugins: readonly Plugin[]; server: ResolvedServerOptions; build: Required<BuildOptions>; preview: ResolvedPreviewOptions; ssr: ResolvedSSROptions; assetsInclude: (file: string) => boolean; logger: Logger; createResolver: (options?: Partial<InternalResolveOptions> | undefined) => ResolveFn; optimizeDeps: DepOptimizationOptions; worker: ResolveWorkerOptions; appType: AppType; experimental: ExperimentalOptions; } & PluginHookUtils>;
  return {
    enforce: 'post',
    name: 'vite-plugin-transform-filter-css-module-post',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    handleHotUpdate({ server, file, modules }) {
      const itemOption = isCssModule(file, options);
      if (!itemOption) {
        return;
      }
      const updates = getUpdateList(modules);
      server.ws.send({
        type: 'update',
        updates,
      });
    },
    async transform(raw, id) {
      const file = id.split("?")[0];
      const itemOption = isCssModule(file, options);
      if (!itemOption) {
        return;
      }

      const moduleObj = moduleJsonMap.get(file);
      if (!moduleObj) {
        return;
      }

      const { moduleJsonCode, cssCode } = moduleObj;


      if (config.command === 'serve') {
        const seviceCode = [
          `import { updateStyle as __vite__updateStyle, removeStyle as __vite__removeStyle } from "/@vite/client"`,
          `const __vite__id = ${JSON.stringify(id)}`,
          `const __vite__css = ${JSON.stringify(cssCode)}`,
          `__vite__updateStyle(__vite__id, __vite__css)`,
          `${moduleJsonCode || `import.meta.hot.accept()\nexport default __vite__css`}`,
          `import.meta.hot.prune(() => __vite__removeStyle(__vite__id))`,
        ].join('\n');
        return {
          code: seviceCode,
        };
      } else {

        return {
          code: moduleJsonCode,
        };
      }
    },
  };
};

const vitePluginTransformFilterCssModule = (options: oneOfModulesType[]) => {
  return [vitePluginTransformFilterCssModulePre(options), vitePluginTransformFilterCssModulePost(options)];
};

export default vitePluginTransformFilterCssModule;
