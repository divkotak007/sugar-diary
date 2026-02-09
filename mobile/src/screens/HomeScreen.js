import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, Title, Paragraph, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation, route }) {
    const user = route.params?.user;
    // Placeholder for data
    const glucose = 120;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Title style={styles.headerTitle}>Sugar Diary</Title>
                    <Button
                        mode="text"
                        icon="cog"
                        onPress={() => navigation.navigate('Settings', { user })}
                        compact
                    >
                        Settings
                    </Button>
                </View>
                <Paragraph>Welcome to your AI-powered companion.</Paragraph>

                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Current Glucose</Title>
                        <Paragraph style={styles.glucoseValue}>{glucose} mg/dL</Paragraph>
                        <Paragraph>Stable • Post-Meal</Paragraph>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="contained" onPress={() => navigation.navigate('GlucoseLog')}>Log New</Button>
                    </Card.Actions>
                </Card>

                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Active Insulin (IOB)</Title>
                        <Paragraph>1.5 Units</Paragraph>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="contained" onPress={() => navigation.navigate('InsulinLog')}>Log Insulin</Button>
                    </Card.Actions>
                </Card>

                <Card style={styles.card}>
                    <Card.Content>
                        <Title>View Patterns</Title>
                        <Paragraph>See your glucose trends over time</Paragraph>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="outlined" icon="calendar" onPress={() => navigation.navigate('Calendar', { user })}>
                            Calendar
                        </Button>
                    </Card.Actions>
                </Card>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    card: {
        marginBottom: 16,
        elevation: 4,
    },
    glucoseValue: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginVertical: 10,
    }
});
