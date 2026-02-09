import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Button, Title, Divider, Card, Paragraph } from 'react-native-paper';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

export default function SettingsScreen({ navigation, route }) {
    const user = route.params?.user;

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            // Auth state listener in App.js will handle navigation
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Card style={styles.userCard}>
                    <Card.Content>
                        <Title>Account</Title>
                        <Paragraph>{user?.email || 'Not signed in'}</Paragraph>
                        <Paragraph style={styles.userId}>
                            User ID: {user?.uid?.substring(0, 8)}...
                        </Paragraph>
                    </Card.Content>
                </Card>

                <List.Section>
                    <List.Subheader>App Settings</List.Subheader>
                    <List.Item
                        title="Notifications"
                        description="Manage notification preferences"
                        left={props => <List.Icon {...props} icon="bell" />}
                        onPress={() => { }}
                    />
                    <List.Item
                        title="Data & Privacy"
                        description="Manage your data"
                        left={props => <List.Icon {...props} icon="shield-check" />}
                        onPress={() => { }}
                    />
                    <List.Item
                        title="Units"
                        description="mg/dL or mmol/L"
                        left={props => <List.Icon {...props} icon="ruler" />}
                        onPress={() => { }}
                    />
                </List.Section>

                <Divider style={styles.divider} />

                <List.Section>
                    <List.Subheader>Integrations</List.Subheader>
                    <List.Item
                        title="Nightscout"
                        description="Connect CGM data"
                        left={props => <List.Icon {...props} icon="cloud-sync" />}
                        onPress={() => { }}
                    />
                    <List.Item
                        title="Export Data"
                        description="Download your logs"
                        left={props => <List.Icon {...props} icon="download" />}
                        onPress={() => { }}
                    />
                </List.Section>

                <Divider style={styles.divider} />

                <Button
                    mode="outlined"
                    onPress={handleSignOut}
                    style={styles.signOutButton}
                    icon="logout"
                >
                    Sign Out
                </Button>

                <Paragraph style={styles.version}>
                    Version 1.0.0 (Phase 1)
                </Paragraph>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 16,
    },
    userCard: {
        marginBottom: 16,
        backgroundColor: '#e3f2fd',
    },
    userId: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    divider: {
        marginVertical: 8,
    },
    signOutButton: {
        marginTop: 24,
        marginBottom: 16,
    },
    version: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
    },
});
