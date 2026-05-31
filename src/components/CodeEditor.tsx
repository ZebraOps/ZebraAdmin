import { useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';

interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  language?: string;
  height?: string;
  placeholder?: string;
  readOnly?: boolean;
}

/**
 * 轻量代码编辑器组件，基于 Monaco Editor（VS Code 内核）
 * 支持 Dockerfile / Jenkinsfile / YAML / Shell 等语法高亮
 */
export default function CodeEditor({
  value = '',
  onChange,
  language = 'dockerfile',
  height = '320px',
  placeholder = '',
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  // 注册 placeholder 插件：空白时显示提示文字
  useEffect(() => {
    // Monaco 的 placeholder 通过 decorations 实现，在 onMount 中处理
  }, []);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // 注册 Dockerfile 语言（Monaco 默认不支持）
    monaco.languages.register({ id: 'dockerfile' });

    // 设置 placeholder decoration
    if (placeholder && !value) {
      const decorationIds = editor.deltaDecorations([], [{
        range: new monaco.Range(1, 1, 1, 1),
        options: {
          after: {
            content: placeholder,
            inlineClassName: 'code-editor-placeholder',
          },
        },
      }]);
      // 监听内容变化，当有内容时移除 placeholder
      editor.onDidChangeModelContent(() => {
        const content = editor.getValue();
        if (content) {
          editor.deltaDecorations(decorationIds, []);
        } else {
          editor.deltaDecorations([], [{
            range: new monaco.Range(1, 1, 1, 1),
            options: {
              after: {
                content: placeholder,
                inlineClassName: 'code-editor-placeholder',
              },
            },
          }]);
        }
      });
    }
  };

  return (
    <div style={{
      border: '1px solid var(--zb-border)',
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      <MonacoEditor
        height={height}
        language={language}
        value={value || ''}
        onChange={(val) => onChange?.(val ?? '')}
        onMount={handleEditorMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 8 },
          folding: true,
          renderLineHighlight: 'all',
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          overviewRulerBorder: false,
          contextmenu: true,
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
        }}
        theme="vs-dark"
      />
    </div>
  );
}