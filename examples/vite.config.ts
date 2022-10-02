import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import vitePluginTransformFilterCssModule from 'vite-plugin-filter-css-moudle';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), vitePluginTransformFilterCssModule([
    {
      test: /\.s[ac]ss$/i,
      modules: {
        generateScopedName: 'px_[local]',
      },
    },
  ]),]
})
