import { dataToEsm } from '@rollup/pluginutils';
import { Plugin, UserConfig } from 'vite';
import { isCssModule, compileCSS, oneOfModulesType, getUpdateList } from './util';
let moduleJsonMap: Map<string, { moduleJsonCode: string; cssCode: string }> = new Map();
const vitePluginTransformFilterCssModulePre = (options: oneOfModulesType[]) => {
  let config: UserConfig;
  return {
    name: 'vite-plugin-transform-filter-css-module-pre',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    async transform(raw: any, id: any) {
      const itemOption = isCssModule(id, options);
      if (!itemOption) {
        return;
      }
      let { code: css, modules } = await compileCSS(id, raw, itemOption.modules, itemOption.plugins);
      const modulesCode =
        modules &&
        dataToEsm(modules, {
          namedExports: true,
          preferConst: true,
        });
      moduleJsonMap.set(id, { moduleJsonCode: modulesCode, cssCode: css });
      return {
        code: css,
      };
    },
  };
};

const vitePluginTransformFilterCssModulePost = (options: oneOfModulesType[]): Plugin => {
  let config;
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
      const itemOption = isCssModule(id, options);
      if (!itemOption) {
        return;
      }
      const moduleObj = moduleJsonMap.get(id);
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
