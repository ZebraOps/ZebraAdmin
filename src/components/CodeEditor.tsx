import { useRef, useState, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Button, Tooltip, Modal } from 'antd';
import { CopyOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons';

interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  language?: string;
  height?: string;
  placeholder?: string;
  readOnly?: boolean;
  /** 是否显示工具栏（复制+全屏按钮） */
  showToolbar?: boolean;
}

/**
 * 代码编辑器组件，基于 Monaco Editor（VS Code 内核）
 * 支持 Dockerfile / Jenkinsfile(Groovy) / YAML / Shell 等语法高亮
 * 支持复制内容、全屏预览/编辑
 */
export default function CodeEditor({
  value = '',
  onChange,
  language = 'dockerfile',
  height = '320px',
  placeholder = '',
  readOnly = false,
  showToolbar = true,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      // 用简单的成功提示
      const tip = document.createElement('div');
      tip.textContent = '已复制';
      tip.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#14b8a6;color:#fff;padding:6px 16px;border-radius:4px;font-size:13px;z-index:9999;pointer-events:none;opacity:1;transition:opacity .3s';
      document.body.appendChild(tip);
      setTimeout(() => { tip.style.opacity = '0'; setTimeout(() => tip.remove(), 300); }, 800);
    });
  }, [value]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monaco.languages.register({ id: 'dockerfile' });

    if (placeholder && !value) {
      let decorationIds = editor.deltaDecorations([], [{
        range: new monaco.Range(1, 1, 1, 1),
        options: { after: { content: placeholder, inlineClassName: 'code-editor-placeholder' } },
      }]);
      editor.onDidChangeModelContent(() => {
        const content = editor.getValue();
        if (content) {
          decorationIds = editor.deltaDecorations(decorationIds, []);
        } else {
          decorationIds = editor.deltaDecorations([], [{
            range: new monaco.Range(1, 1, 1, 1),
            options: { after: { content: placeholder, inlineClassName: 'code-editor-placeholder' } },
          }]);
        }
      });
    }
  };

  const editorOptions = {
    readOnly,
    minimap: { enabled: false },
    fontSize: fullscreen ? 15 : 13,
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
  };

  const toolbar = showToolbar && (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '4px 8px', background: '#1e1e1e', borderBottom: '1px solid #333',
    }}>
      <span style={{ color: '#888', fontSize: 12, fontFamily: 'monospace' }}>
        {language === 'dockerfile' ? 'Dockerfile' : language === 'groovy' ? 'Jenkinsfile' : language.toUpperCase()}
        {readOnly && <span style={{ marginLeft: 8, color: '#14b8a6' }}>只读</span>}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <Tooltip title="复制内容">
          <Button size="small" type="text" icon={<CopyOutlined />}
            style={{ color: '#aaa' }}
            onClick={handleCopy}
          />
        </Tooltip>
        <Tooltip title={fullscreen ? '退出全屏' : '全屏编辑'}>
          <Button size="small" type="text"
            icon={fullscreen ? <CompressOutlined /> : <ExpandOutlined />}
            style={{ color: '#aaa' }}
            onClick={() => setFullscreen(!fullscreen)}
          />
        </Tooltip>
      </div>
    </div>
  );

  const editorContent = (
    <>
      {toolbar}
      <MonacoEditor
        height={fullscreen ? 'calc(100vh - 80px)' : height}
        language={language}
        value={value || ''}
        onChange={(val) => onChange?.(val ?? '')}
        onMount={handleEditorMount}
        options={editorOptions}
        theme="vs-dark"
      />
    </>
  );

  // 全屏模式用 Modal 展示，提供更大操作空间
  if (fullscreen) {
    return (
      <Modal
        open={fullscreen}
        onCancel={() => setFullscreen(false)}
        footer={null}
        width="100vw"
        style={{ top: 0, maxWidth: '100vw', padding: 0 }}
        styles={{ body: { padding: 0, height: '100vh' } }}
        destroyOnClose
      >
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          {editorContent}
        </div>
      </Modal>
    );
  }

  // 非全屏模式：带边框的内嵌编辑器
  return (
    <div style={{
      border: '1px solid var(--zb-border)',
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      {editorContent}
    </div>
  );
}