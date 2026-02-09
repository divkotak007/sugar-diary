import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Title, HelperText, Card, Paragraph } from 'react-native-paper';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async () => {
        if (!email || !password) {
            setError('Please enter email and password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (isSignup) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            // Navigation will be handled by auth state listener in App.js
        } catch (err) {
            console.error('Auth error:', err);

            // User-friendly error messages
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please sign in.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address.');
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Invalid email or password.');
            } else {
                setError('Authentication failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Title style={styles.title}>Sugar Diary AI</Title>
                    <Paragraph style={styles.subtitle}>
                        {isSignup ? 'Create your account' : 'Sign in to continue'}
                    </Paragraph>

                    <Card style={styles.card}>
                        <Card.Content>
                            <TextInput
                                label="Email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                mode="outlined"
                                style={styles.input}
                            />

                            <TextInput
                                label="Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                mode="outlined"
                                style={styles.input}
                            />

                            <HelperText type="error" visible={!!error}>
                                {error}
                            </HelperText>

                            <Button
                                mode="contained"
                                onPress={handleAuth}
                                loading={loading}
                                disabled={loading}
                                style={styles.button}
                            >
                                {isSignup ? 'Sign Up' : 'Sign In'}
                            </Button>

                            <Button
                                mode="text"
                                onPress={() => {
                                    setIsSignup(!isSignup);
                                    setError('');
                                }}
                                style={styles.switchButton}
                            >
                                {isSignup
                                    ? 'Already have an account? Sign In'
                                    : "Don't have an account? Sign Up"}
                            </Button>
                        </Card.Content>
                    </Card>

                    <Paragraph style={styles.disclaimer}>
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </Paragraph>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#6200ee',
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 32,
        color: '#666',
    },
    card: {
        elevation: 4,
    },
    input: {
        marginBottom: 12,
    },
    button: {
        marginTop: 16,
        paddingVertical: 6,
    },
    switchButton: {
        marginTop: 8,
    },
    disclaimer: {
        marginTop: 24,
        textAlign: 'center',
        fontSize: 12,
        color: '#999',
    },
});
