import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Button } from '../../ui/components';
import { useAuth } from '../../auth/AuthProvider';
import { SignupStackParamList } from '../../navigation/types';
import {
  SignupHeader,
  SignupLayout,
  SignupTitle,
  SignupText,
  FieldLabel,
  SignupField,
} from './SignupChrome';

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export const EmailEntryScreen = () => {
  const navigation = useNavigation<NavigationProp<SignupStackParamList>>();
  const { auth } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const valid = looksLikeEmail(email);

  const sendLink = async () => {
    setSending(true);
    try {
      await auth.sendSignInLink(email.trim());
      navigation.navigate('CheckEmail', { email: email.trim() });
    } catch {
      Alert.alert("Couldn't send the link", 'Check the address and your connection, then try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SignupLayout
      header={<SignupHeader step={1} onBack={() => navigation.goBack()} />}
      footer={
        <Button
          label={sending ? 'Sending…' : 'Send Link'}
          variant="secondary"
          onPress={sendLink}
          disabled={!valid || sending}
        />
      }
    >
      <SignupTitle>What's your email?</SignupTitle>
      <SignupText>We'll email you a link to sign in. No password needed.</SignupText>
      <FieldLabel>Email</FieldLabel>
      <SignupField
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        autoFocus
        returnKeyType="send"
        onSubmitEditing={() => valid && sendLink()}
        active
      />
    </SignupLayout>
  );
};
