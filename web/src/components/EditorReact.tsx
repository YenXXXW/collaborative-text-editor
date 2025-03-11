import Editor from '@monaco-editor/react';
import { useRef, useEffect } from 'react'
import { editor } from 'monaco-editor'


interface Change {
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
  text: string;
  rangeLength: number;
}

interface EditorReactProps {
  onChangeHandler: (change: Change) => void;
  remoteChange: Change | null;
  initialValue: string;
}

export default function EditorReact({
  onChangeHandler,
  remoteChange,
  initialValue
}: EditorReactProps) {

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const isApplyingRef = useRef(false);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  }

  useEffect(() => {
    if (remoteChange && editorRef.current) {
      const model = editorRef.current.getModel();
      if (!model) return;

      isApplyingRef.current = true;
      model.pushEditOperations(
        [],
        [
          {
            range: {
              startLineNumber: remoteChange.startLineNumber,
              startColumn: remoteChange.startColumn,
              endLineNumber: remoteChange.endLineNumber,
              endColumn: remoteChange.endColumn,
            },
            text: remoteChange.text,
          },
        ],
        () => null
      )
      isApplyingRef.current = false;
    }
  }, [remoteChange]);

  function handleEditorChange(_: string | undefined,
    event: editor.IModelContentChangedEvent) {
    if (isApplyingRef.current) return;

    const changes = event.changes;
    if (changes.length > 0) {
      // Send only the change information
      const change = changes[0];
      onChangeHandler({
        startLineNumber: change.range.startLineNumber,
        startColumn: change.range.startColumn,
        endLineNumber: change.range.endLineNumber,
        endColumn: change.range.endColumn,
        text: change.text,
        rangeLength: change.rangeLength,
      });
    }
  }

  return (
    <Editor
      height="100vh"
      theme='vs-dark'
      defaultLanguage="javascript"
      defaultValue={initialValue}
      onMount={handleEditorDidMount}
      onChange={handleEditorChange}
      options={{
        minimap: { enabled: false },
        automaticLayout: true,
        padding: { top: 10 }
      }}
    />
  );

}
