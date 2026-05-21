import React, { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import * as mfm from 'mfm-js';
import { Animated, Image, Text } from 'react-native';
import { noteContentStyle } from '../styles/styles';
import { ColorScheme } from '../utils/types';

function MfmFunctionNode({ node, children }: { node: any; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (node.props.name === 'spin') {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    } else if (node.props.name === 'jelly') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true })
        ])
      ).start();
    } else if (node.props.name === 'tada' || node.props.name === 'shake') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(anim, { toValue: -1, duration: 100, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 500, useNativeDriver: true })
        ])
      ).start();
    }
  }, [node.props.name]);

  if (node.props.name === 'spin') {
    const rotate = anim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
    return <Animated.View style={{ transform: [{ rotate }] }}><Text>{children}</Text></Animated.View>;
  }
  if (node.props.name === 'jelly') {
    const scale = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.2],
    });
    return <Animated.View style={{ transform: [{ scale }] }}><Text>{children}</Text></Animated.View>;
  }
  if (node.props.name === 'tada' || node.props.name === 'shake') {
    const rotate = anim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['-10deg', '0deg', '10deg'],
    });
    return <Animated.View style={{ transform: [{ rotate }] }}><Text>{children}</Text></Animated.View>;
  }

  // フォールバック
  return <Text>{children}</Text>;
}

export function MfmRenderer({
  nodes,
  emojis = {},
  colors,
}: {
  nodes: mfm.MfmNode[];
  emojis?: Record<string, string>;
  colors: ColorScheme;
}) {
  const renderNodes = (targetNodes: mfm.MfmNode[], keyPrefix: string) =>
    targetNodes.map((node, i) => {
      const key = `${keyPrefix}-${i}`;
      if (node.type === 'text') {
        return (
          <Text key={key} style={{ color: colors.text, flexShrink: 1 }}>
            {node.props.text}
          </Text>
        );
      }
      if (node.type === 'unicodeEmoji') {
        return <Text key={key}>{node.props.emoji}</Text>;
      }
      if (node.type === 'emojiCode') {
        const emojiUrl = emojis[node.props.name] || emojis[`:${node.props.name}:`];
        if (emojiUrl) {
          return (
            <Image
              key={key}
              source={{ uri: emojiUrl }}
              style={{ width: 20, height: 20, marginHorizontal: 1 }}
              resizeMode="contain"
            />
          );
        }
        return (
          <Text key={key} style={{ color: colors.text }}>
            :{node.props.name}:
          </Text>
        );
      }
      if (node.type === 'url') {
        return (
          <Text key={key} style={{ color: colors.primaryText, textDecorationLine: 'underline', flexShrink: 1 }} onPress={() => Linking.openURL(node.props.url)}>
            {node.props.url}
          </Text>
        );
      }
      if (node.type === 'link') {
        return (
          <Text key={key} style={{ color: colors.primaryText, textDecorationLine: 'underline', flexShrink: 1 }} onPress={() => Linking.openURL(node.props.url)}>
            {renderNodes(node.children, key)}
          </Text>
        );
      }
      if (node.type === 'mention') {
        return (
          <Text key={key} style={{ color: colors.primaryText, flexShrink: 1 }}>
            {node.props.acct}
          </Text>
        );
      }
      if (node.type === 'hashtag') {
        return (
          <Text key={key} style={{ color: colors.primaryText, flexShrink: 1 }}>
            #{node.props.hashtag}
          </Text>
        );
      }
      if (node.type === 'bold') {
        return (
          <Text key={key} style={{ fontWeight: 'bold', color: colors.text, flexShrink: 1 }}>
            {renderNodes(node.children, key)}
          </Text>
        );
      }
      if (node.type === 'italic') {
        return (
          <Text key={key} style={{ fontStyle: 'italic', color: colors.text, flexShrink: 1 }}>
            {renderNodes(node.children, key)}
          </Text>
        );
      }
      if (node.type === 'strike') {
        return (
          <Text key={key} style={{ textDecorationLine: 'line-through', color: colors.text, flexShrink: 1 }}>
            {renderNodes(node.children, key)}
          </Text>
        );
      }
      if (node.type === 'quote') {
        return (
          <Text key={key} style={{ color: colors.textMuted, flexShrink: 1 }}>
            {'\n'}
            {'「'}
            {renderNodes(node.children, key)}
            {'」'}
            {'\n'}
          </Text>
        );
      }
      if (node.type === 'fn') {
        return (
          <MfmFunctionNode key={key} node={node}>{renderNodes(node.children, key)}</MfmFunctionNode>
        );
      }
      if ('children' in node && Array.isArray(node.children)) {
        return (
          <Text key={key} style={{ color: colors.text, flexShrink: 1 }}>
            {renderNodes(node.children, key)}
          </Text>
        );
      }
      return null;
    });

  return <Text style={[noteContentStyle, { color: colors.text }]}>{renderNodes(nodes, 'node')}</Text>;
}
