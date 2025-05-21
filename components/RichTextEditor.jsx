import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../constants/theme';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

const RichTextEditor = ({ 
  editorRef, 
  onChange,
  initialHeight = 184,
  placeholder = "Type something here... Use *text* to make it bold",
  containerStyle,
  editorStyle,
  disableCopyPaste = false // New prop to disable copy-paste
}) => {

const ensureDivWrapped = (text) => {
  const trimmedText = text.trim();
  if (!trimmedText.startsWith('<div')) {
    return `<div>${trimmedText}</div>`;
  }
  return trimmedText;
};

const isHtml = (text) => /<\/?[a-z][\s\S]*>/i.test(text);

const handlePaste = (pastedText) => {
  // If copy-paste is disabled, ignore the paste event
  if (disableCopyPaste) {
    return;
  }

  if (isHtml(pastedText.trim())) {
    const wrappedText = ensureDivWrapped(pastedText);
    editorRef.current?.insertHTML(wrappedText);
  } else {
    let styledText = processText(pastedText);
    const wrappedText = ensureDivWrapped(styledText);
    editorRef.current?.insertHTML(wrappedText);
  }
};

  const handleChange = (text) => {
    const processedText = processText(text);
    const wrappedText = ensureDivWrapped(processedText);
  
    if (wrappedText !== text) {
      editorRef.current?.setContentHTML(wrappedText);
    }
  
    onChange && onChange(wrappedText);
  };

  // Text processing function
  const processText = (text) => {
    // Text recognition patterns
    const patterns = {
      url: /(https?:\/\/[^\s]+)/g,
      email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g,
      phone: /(\+?[\d\s-]{10,})/g,
      date: /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/g,
      hashtag: /#[a-zA-Z0-9_]+/g,
      mention: /@[a-zA-Z0-9_]+/g,
      starred: /\*(.*?)\*/g  // New pattern for text between stars
    };

    let styledText = text;

    // Process starred text (must be done first to avoid HTML conflicts)
    styledText = styledText.replace(patterns.starred, (match, content) => 
      `<strong>${content}</strong>`
    );

    return styledText;
  };

  return (
    <View style={{ minHeight: 2 }}>
      <RichToolbar
        actions={[
          actions.insertLink,
          actions.setUnderline,
          actions.setStrikethrough,
          actions.removeFormat,
          actions.setBold,
          actions.setItalic,
          actions.setParagraph,
          actions.undo,
          actions.redo,
          actions.indent,
          actions.outdent,
          actions.insertBulletsList,
          actions.insertOrderedList,
          actions.blockquote,
          actions.alignLeft,
          actions.alignCenter,
          actions.alignRight,
          actions.line,
          actions.heading6,
          actions.heading5,
          actions.heading4,
          actions.heading3,
          actions.heading2,
          actions.heading1,
          actions.setSubscript,
          actions.setSuperscript,
          actions.code,
        ]}
        iconMap={{
          [actions.setParagraph]: ({ tintColor }) => <Text style={{ color: tintColor }}>para</Text>,
          [actions.heading1]: ({ tintColor }) => <Text style={{ color: tintColor }}>H1</Text>,
          [actions.heading2]: ({ tintColor }) => <Text style={{ color: tintColor }}>H2</Text>,
          [actions.heading4]: ({ tintColor }) => <Text style={{ color: tintColor }}>H4</Text>,
          [actions.heading3]: ({ tintColor }) => <Text style={{ color: tintColor }}>H3</Text>,
          [actions.heading5]: ({ tintColor }) => <Text style={{ color: tintColor }}>H5</Text>,
          [actions.heading6]: ({ tintColor }) => <Text style={{ color: tintColor }}>H6</Text>,
        }}
        style={styles.richBar}
        flatContainerStyle={styles.flattStyle}
        selectedIconTint={theme.colors.primaryDark}
        editor={editorRef}
        disabled={false}
      />

      <RichEditor
        ref={editorRef}
        containerStyle={[styles.rich, containerStyle]}
        editorStyle={[styles.containerStyle, editorStyle]}
        placeholder={placeholder}
        onChange={handleChange}
        onPaste={handlePaste}
        pasteAsPlainText={false}
        initialHeight={initialHeight}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  richBar: {
    borderTopRightRadius: theme.radius.xl,
    borderTopLeftRadius: theme.radius.xl,
    backgroundColor: theme.colors.gray,
  },
  listStyle: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    marginTop: 10,
  },
  rich: {
    minHeight: 144,
    flex: 1,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: theme.colors.gray,
    padding: 5,
  },
  containerStyle: {
    padding: 10,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.darkLight,
    backgroundColor: "#edf2ef"
  },
  contentStyle: {
    color: theme.colors.textDark,
    placeholderColor: 'gray',
  },
  flattStyle: {
    paddingHorizontal: 2,
  }
});

export default RichTextEditor;