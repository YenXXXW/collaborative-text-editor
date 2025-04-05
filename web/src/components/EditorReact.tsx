import Editor from '@monaco-editor/react';
import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { editor } from 'monaco-editor'
import "monaco-editor/esm/vs/basic-languages/python/python";
import "monaco-editor/esm/vs/basic-languages/java/java";
import "monaco-editor/esm/vs/basic-languages/cpp/cpp";
import "monaco-editor/esm/vs/basic-languages/go/go";
import "monaco-editor/esm/vs/basic-languages/html/html";
import "monaco-editor/esm/vs/basic-languages/rust/rust";
import "monaco-editor/esm/vs/basic-languages/css/css";
import "monaco-editor/esm/vs/basic-languages/php/php";

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
  language: string;
}

export interface EditorReactRef {
  getEditorInstance: () => editor.IStandaloneCodeEditor | null;
}

const EditorReact = forwardRef<EditorReactRef, EditorReactProps>(
  ({ onChangeHandler, remoteChange, initialValue, language }, ref) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const isApplyingRef = useRef(false);

    useImperativeHandle(ref, () => ({
      getEditorInstance: () => editorRef.current,
    }));

    const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor) => {
      editorRef.current = editorInstance;
    };

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
        );
        isApplyingRef.current = false;
      }
    }, [remoteChange]);

    function handleEditorChange(_: string | undefined, event: editor.IModelContentChangedEvent) {
      if (isApplyingRef.current) return;

      const changes = event.changes;
      if (changes.length > 0) {
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

    const handleLanguageChange = (newLanguage: string) => {
      const iTextModel = editorRef.current?.getModel();
      if (iTextModel) {
        editor.setModelLanguage(iTextModel, newLanguage);
      }
    };

    useEffect(() => {
      handleLanguageChange(language);
    }, [language]);

    return (
      <Editor
        height="94vh"
        theme="vs-dark"
        language={language}
        defaultValue={initialValue}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          automaticLayout: true,
        }}
      />
    );
  });

export default EditorReact;

