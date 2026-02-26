import React, { memo, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import {
  Markdown,
  MarkdownStream,
  createMarkdownSession,
  type PartialMarkdownTheme,
  type CodeBlockRendererProps,
} from 'react-native-nitro-markdown';
import CodeHighlighter from 'react-native-code-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  content: string;
  isStreaming: boolean;
  textColor: string;
  codeHeaderColor: string;
  onCopyCode: (code: string) => void;
};

const STREAM_UPDATE_MS = 50;

const StreamingContent = memo(({
  content,
  mdTheme,
  renderers,
}: {
  content: string;
  mdTheme: PartialMarkdownTheme;
  renderers: any;
}) => {
  const sessionRef = useRef(createMarkdownSession());
  const prevLenRef = useRef(0);

  useEffect(() => {
    const session = sessionRef.current;
    const prevLen = prevLenRef.current;

    if (content.length === 0) {
      session.clear();
      prevLenRef.current = 0;
      return;
    }

    const prevText = session.getAllText();

    if (content.startsWith(prevText) && content.length >= prevLen) {
      const delta = content.slice(prevLen);
      if (delta.length > 0) {
        session.append(delta);
      }
    } else {
      session.clear();
      session.append(content);
    }
    prevLenRef.current = content.length;
  }, [content]);

  useEffect(() => {
    return () => {
      sessionRef.current.clear();
    };
  }, []);

  return (
    <MarkdownStream
      session={sessionRef.current}
      updateIntervalMs={STREAM_UPDATE_MS}
      updateStrategy="raf"
      incrementalParsing
      theme={mdTheme}
      renderers={renderers}
      stylingStrategy="minimal"
    />
  );
});

const StaticContent = memo(({
  content,
  mdTheme,
  renderers,
}: {
  content: string;
  mdTheme: PartialMarkdownTheme;
  renderers: any;
}) => (
  <Markdown
    theme={mdTheme}
    renderers={renderers}
    stylingStrategy="minimal"
  >
    {content}
  </Markdown>
));

function ChatMarkdown({ content, isStreaming, textColor, codeHeaderColor, onCopyCode }: Props) {
  const mdTheme = useMemo<PartialMarkdownTheme>(() => ({
    colors: {
      text: textColor,
      heading: textColor,
      code: '#fff',
      codeBackground: '#000',
      codeLanguage: '#94a3b8',
      link: '#60a5fa',
      blockquote: textColor,
      border: 'rgba(255,255,255,0.15)',
      surface: 'transparent',
      surfaceLight: 'transparent',
      tableBorder: 'rgba(255,255,255,0.15)',
      tableHeader: 'rgba(255,255,255,0.05)',
      tableHeaderText: textColor,
      tableRowEven: 'transparent',
      tableRowOdd: 'rgba(255,255,255,0.03)',
    },
    spacing: { xs: 2, s: 4, m: 4, l: 8, xl: 12 },
    fontSizes: {
      xs: 12, s: 14, m: 15, l: 16, xl: 17,
      h1: 18, h2: 17, h3: 16, h4: 15, h5: 15, h6: 15,
    },
    fontFamilies: {
      regular: undefined,
      heading: undefined,
      mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    borderRadius: { s: 4, m: 8, l: 12 },
    showCodeLanguage: true,
  }), [textColor]);

  const codeBlockRenderer = useCallback((props: CodeBlockRendererProps) => {
    const { content: code, language } = props;
    return (
      <View style={codeStyles.wrapper}>
        <CodeHighlighter
          hljsStyle={atomOneDark}
          textStyle={codeStyles.text}
          scrollViewProps={{
            style: codeStyles.scroll,
            contentContainerStyle: codeStyles.scrollContent,
          }}
          {...({ language: language || 'text' } as any)}
        >
          {code || ''}
        </CodeHighlighter>
        <TouchableOpacity
          style={codeStyles.copyBtn}
          onPress={() => onCopyCode(code)}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <MaterialCommunityIcons
            name="content-copy"
            size={14}
            color={codeHeaderColor}
          />
        </TouchableOpacity>
      </View>
    );
  }, [onCopyCode, codeHeaderColor]);

  const renderers = useMemo(() => ({
    code_block: codeBlockRenderer,
  }), [codeBlockRenderer]);

  const trimmed = content?.trim() || '';
  if (!trimmed) return null;

  if (isStreaming) {
    return (
      <StreamingContent
        content={trimmed}
        mdTheme={mdTheme}
        renderers={renderers}
      />
    );
  }

  return (
    <StaticContent
      content={trimmed}
      mdTheme={mdTheme}
      renderers={renderers}
    />
  );
}

const codeStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    position: 'relative',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  scroll: {
    backgroundColor: '#000',
  },
  scrollContent: {
    backgroundColor: '#000',
  },
  copyBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    padding: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
});

export default memo(ChatMarkdown);
