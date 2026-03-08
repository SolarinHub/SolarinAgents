/*
  Error boundary for ChatMarkdown.
  Catches native crashes from the markdown parser
  (e.g. malformed math/LaTeX from OCR content)
  and falls back to plain Text rendering.
*/
import React, { Component } from 'react';
import { Text, View, StyleSheet } from 'react-native';

type Props = {
  children: React.ReactNode;
  fallbackContent: string;
  textColor: string;
};

type State = {
  hasError: boolean;
};

export default class MarkdownBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.log('markdown_render_error', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.fallback}>
          <Text style={[styles.text, { color: this.props.textColor }]} selectable>
            {this.props.fallbackContent}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    paddingHorizontal: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
});
