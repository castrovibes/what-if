import { Alert, ActionSheetIOS, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../auth/AuthProvider';
import { ReauthRequiredError } from '../../auth/types';
import { toast } from '../../ui/toast';

/**
 * Log out and delete account. These are the two places a native confirmation is
 * right: both are destructive, and the system sheet is what people expect for them.
 */
export const useAccountActions = () => {
  const navigation = useNavigation();
  const { signOut, deleteAccount } = useAuth();

  const confirmLogOut = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Log Out'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: 'Are you sure you want to log out?',
        },
        buttonIndex => {
          if (buttonIndex === 1) signOut();
        },
      );
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
      ]);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account and everything synced to it: favorites, reflections and progress. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              toast.show({ message: 'Your account and its data have been deleted.', icon: 'check' });
            } catch (e) {
              if (e instanceof ReauthRequiredError) {
                Alert.alert('Please sign in again', e.message, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign in again',
                    onPress: async () => {
                      await signOut();
                      navigation.navigate('Signup' as never);
                    },
                  },
                ]);
              } else {
                toast.show({
                  message: 'Couldn’t delete your account. Check your connection and try again.',
                  icon: 'alert-circle',
                });
              }
            }
          },
        },
      ],
    );
  };

  return { confirmLogOut, confirmDeleteAccount };
};
