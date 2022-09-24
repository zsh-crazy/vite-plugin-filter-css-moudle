# vite-plugin-filter-css-moudle

主要解决 vite 在 react 和 preact 中的使用，主要解决增加.module.xx 的问题，同时可以对不同目录下的 css-module 进行处理，解决样式覆盖问题，目前已经可以设置正常热更新和打包

#使用
例如，对于 src 目录下的 components 这些公用组件，我想覆盖样式，那文件名就不能有 hash 值
其它的业务中的文件我不需要覆盖此时要加上 hash 防止重复

```
plugins:[
  vitePluginTransformCssModule([
      {
        test: /src\/components\/([a-z\-]+\/)*[a-z\-]+\.s[ac]ss$/i,
        modules: {
          generateScopedName: 'cy_[local]',
        },
      },
      {
        test: /\.s[ac]ss$/i,
        modules: {
          generateScopedName: '[path]___[local]___[hash:base64:5]',
        },
      }
  ])
]
```

注意：目前开发环境和打包都可以正常使用，没有加 souremap，优先级按照配置顺序进行，希望能帮助大家
