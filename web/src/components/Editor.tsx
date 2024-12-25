import { useEffect } from "react";
import * as monaco from 'monaco-editor'


const Editor = () => {

  useEffect(() => {
    (self as any).MonacoEnvironment = {
      getWorker: (label: string) => {
        const getWorkerModule = (moduleUrl: string, label: string) => {
          return new Worker((self as any).MonacoEnvironment.getWorkerUrl(moduleUrl), {
            name: label,
            type: 'module',
          });
        };
        switch (label) {
          case 'json':
            return getWorkerModule('/monaco-editor/esm/vs/language/json/json.worker?worker', label);
          case 'css':
          case 'scss':
          case 'less':
            return getWorkerModule('/monaco-editor/esm/vs/language/css/css.worker?worker', label);
          case 'html':
          case 'handlebars':
          case 'razor':
            return getWorkerModule('/monaco-editor/esm/vs/language/html/html.worker?worker', label);
          case 'typescript':
          case 'javascript':
            return getWorkerModule('/monaco-editor/esm/vs/language/typescript/ts.worker?worker', label);
          default:
            return getWorkerModule('/monaco-editor/esm/vs/editor/editor.worker?worker', label);
        }
      },
    };

    // Initialize the Monaco Editor
    monaco.editor.create(document.getElementById('editor-container') as HTMLElement, {
      value: "function hello() {\n\talert('Hello world!');\n}",
      language: 'javascript',
      theme: 'vs-white', // Set theme (optional)
    });
  }, [])

  return <div id="editor-container" style={{ height: '100vh', width: '50vw' }} />;
}

export default Editor
