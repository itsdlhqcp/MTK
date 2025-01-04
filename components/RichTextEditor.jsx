
import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../constants/theme';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

const RichTextEditor = ({ editorRef, onChange }) => {
  // Handler for paste events and text changes
  const handlePaste = (pastedText) => {
    let styledText = processText(pastedText);
    editorRef.current?.insertHTML(styledText);
  };

  // Process text as it's being typed or changed
  const handleChange = (text) => {
    // Process the text for star formatting
    const processedText = processText(text);
    
    // Only update if there's a difference to avoid infinite loops
    if (processedText !== text) {
      editorRef.current?.setContentHTML(processedText);
    }
    
    onChange && onChange(processedText);
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

    // Process hashtags
    // styledText = styledText.replace(patterns.hashtag, (match) => 
    //   `<span style="color: #FF5722; font-weight: bold;">${match}</span>`
    // );

    // Process mentions
    // styledText = styledText.replace(patterns.mention, (match) => 
    //   `<span style="color: #00BCD4; font-weight: bold;">${match}</span>`
    // );

    return styledText;
  };

  return (
    <View style={{ minHeight: 285 }}>
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
        containerStyle={styles.rich}
        editorStyle={styles.containerStyle}
        placeholder="Type something here... Use *text* to make it bold"
        onChange={handleChange}
        onPaste={handlePaste}
        pasteAsPlainText={false}
        initialHeight={250}
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
    minHeight: 270,
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