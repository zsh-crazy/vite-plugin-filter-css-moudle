import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts';
import pkg from './package.json';
import { resolve } from 'path';
import del from 'rollup-plugin-delete';
export default [
  {
    input: './src/index.ts',
    output: [
      { format: 'cjs', file: pkg.main, exports: 'auto' },
      { format: 'esm', file: pkg.module },
    ],
    plugins: [
      nodeResolve({
        extensions: ['ts', 'tsx', 'js', 'jsx'],
        exclude: '**/node_modules/**',
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        removeComments: true,
        useTsconfigDeclarationDir: true,
      }),
    ],
  },
  {
    input: resolve(__dirname, 'dist/types/index.d.ts'),
    output: [{ file: resolve(__dirname, 'dist/index.d.ts'), format: 'es' }],
    plugins: [dts(), process.env.NODE_ENV === 'production' ? del({ hook: 'buildEnd', targets: './dist/types' }) : []],
  },
];
