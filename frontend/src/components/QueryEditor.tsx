import { Play, Loader, AlertCircle } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';

import type { models } from '../../wailsjs/go/models';
import type { Theme } from '../types';

// Custom Pico theme
const picoDarkTheme = EditorView.theme({
  '&': {
    color: '#e6e6e6',
    backgroundColor: '#1f2529',
  },
  '.cm-content': {
    caretColor: '#58a6ff',
  },
  '.cm-cursor': {
    borderLeftColor: '#58a6ff',
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: '#3a4a5a',
  },
});

const picoLightTheme = EditorView.theme({
  '&': {
    color: '#24292f',
    backgroundColor: '#ffffff',
  },
  '.cm-content': {
    caretColor: '#0366d6',
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: '#c8e1ff',
  },
});

// Syntax highlighting styles
const picoHighlightStyle = EditorView.theme({
  // Keywords (SELECT, FROM, WHERE, JOIN, etc.)
  '.cm-keyword': { color: '#d73a49', fontWeight: '600' },        // Strong red-pink (Pico style)
  
  // Functions (count, jsonb_build_object, etc.)
  '.cm-function': { color: '#0066cc' },                         // Blue
  
  // Types (TEXT, UUID, JSONB, TIMESTAMP, etc.)
  '.cm-typeName, .cm-type': { color: '#6f42c1' },               // Purple
  
  // Strings
  '.cm-string': { color: '#22863a' },                           // Green
  
  // Numbers
  '.cm-number': { color: '#c76c2f' },                           // Orange-brown
  
  // Comments
  '.cm-comment': { color: '#6a737d', fontStyle: 'italic' },     // Muted gray
  
  // Operators and punctuation
  '.cm-operator': { color: '#d73a49' },
  '.cm-punctuation': { color: '#586069' },
  
  // Variables / identifiers
  '.cm-variableName': { color: '#e36209' },                     // Orange
  '.cm-propertyName': { color: '#005cc5' },
});

function createPosticoTheme(isDark: boolean): Extension[] {
  return [
    isDark ? picoDarkTheme : picoLightTheme,
    picoHighlightStyle,
  ];
}

interface QueryEditorProps {
  theme: Theme;
  sqlQuery: string;
  onQueryChange: (query: string) => void;
  isRunning: boolean;
  onRunQuery: () => void;
  error: string;
  queryResult: models.QueryResult | null;
}

export function QueryEditor({
  theme,
  sqlQuery,
  onQueryChange,
  isRunning,
  onRunQuery,
  error,
  queryResult,
}: QueryEditorProps) {
  const isDark = theme === 'dark';

  return (
    <div className="flex-1 flex flex-col w-full min-w-0 overflow-hidden">
      {/* Toolbar */}
      <div
        className={`p-4 border-b flex items-center gap-3 shrink-0 ${
          isDark
            ? 'border-gray-700 bg-gray-950'
            : 'border-gray-200 bg-gray-100'
        }`}
      >
        <button
          onClick={onRunQuery}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all ${
            isRunning
              ? 'bg-gray-500 opacity-50'
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          {isRunning ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Play size={16} />
          )}
          {isRunning ? 'Running...' : 'Execute'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className={`flex items-center gap-2 px-4 py-3 text-sm shrink-0 ${
            isDark
              ? 'bg-red-900/30 text-red-300'
              : 'bg-red-100 text-red-700'
          }`}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Editor + Results */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* SQL Editor */}
        <div
          className={`border-b overflow-hidden ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <CodeMirror
            value={sqlQuery}
            height="250px"
            extensions={[
              sql({
                dialect: PostgreSQL,
              }),
              ...createPosticoTheme(isDark),
            ]}
            theme={isDark ? oneDark : 'light'}
            onChange={(value) => onQueryChange(value)}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              defaultKeymap: true,
            }}
            className="text-sm font-mono"
          />
        </div>

        {/* Query Results - unchanged */}
        {queryResult && (
          <div
            className={`flex-1 min-h-0 overflow-auto ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div
              className={`p-4 border-b text-sm sticky top-0 z-10 ${
                isDark
                  ? 'border-gray-700 text-gray-400 bg-gray-900'
                  : 'border-gray-200 text-gray-600 bg-white'
              }`}
            >
              {queryResult.rowCount} rows
            </div>

            <div className="overflow-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead
                  className={`sticky top-[53px] z-10 ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}
                >
                  <tr>
                    {queryResult.columns.map((col, i) => (
                      <th
                        key={i}
                        className={`px-4 py-3 text-left font-semibold border-r whitespace-nowrap ${
                          isDark ? 'border-gray-700' : 'border-gray-200'
                        }`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {queryResult.rows.map((row, ri) => (
                    <tr
                      key={ri}
                      className={`border-b ${
                        isDark
                          ? 'border-gray-800 hover:bg-gray-800/50'
                          : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className={`px-4 py-2 font-mono border-r whitespace-nowrap ${
                            isDark ? 'border-gray-800' : 'border-gray-100'
                          }`}
                        >
                          {cell === null ? (
                            <span
                              className={
                                isDark ? 'text-gray-500' : 'text-gray-400'
                              }
                            >
                              NULL
                            </span>
                          ) : (
                            String(cell)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}