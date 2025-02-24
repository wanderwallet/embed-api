import path from 'path'
import { defineConfig } from 'tsup'

export default defineConfig({
  target: 'es2020',
  format: ['cjs', 'esm'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  entry: ["./index.ts"],
  ignoreWatch: ["./dist"],
  tsconfig: path.resolve(__dirname, "./tsconfig-sdk.json"),
})
