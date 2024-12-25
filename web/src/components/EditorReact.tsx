import Editor from '@monaco-editor/react';
import { DiffEditor } from '@monaco-editor/react';
import { useRef } from 'react'

export default function EditorReact() {


  function handleEditorChange(value, event) {
    console.log('here is the current model value:', value);
  }

  return (
    <Editor
      height="90vh"
      defaultLanguage="javascript"
      defaultValue="// some comment"
      onChange={handleEditorChange}

    />
  );

}
