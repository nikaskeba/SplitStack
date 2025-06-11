/* client/src/setupMonaco.js  (create this small helper) */
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export function configureMonaco() {
  // allow JS + JSX checking
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    allowJs: true,
    checkJs: true,
    jsx: monaco.languages.typescript.JsxEmit.React
  });
}