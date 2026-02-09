import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Title, HelperText, Card, Paragraph, Chip } from 'react-native-paper';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { checkDoseSafety, calculateIOB } from '../services/safety';

export default function InsulinLogScreen({ navigation, route }) {
    const user = route.params?.user;
    const [units, setUnits] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [safetyCheck, setSafetyCheck] = useState(null);
    const [currentIOB, setCurrentIOB] = useState(0);

    // Fetch recent insulin logs for IOB calculation
    useEffect(() => {
        if (user?.uid) {
            fetchRecentInsulinLogs();
        }
    }, [user]);

    const fetchRecentInsulinLogs = async () => {
        try {
            // Fetch logs from last 6 hours
            const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

            const q = query(
                collection(db, 'insulinLogs'),
                where('userId', '==', user?.uid),
                where('timestamp', '>=', sixHoursAgo),
                orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(q);
            const logs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const iob = calculateIOB(logs);
            setCurrentIOB(iob);
        } catch (err) {
            console.error('Error fetching insulin logs:', err);
        }
    };

    const handleCheckSafety = () => {
        if (!units) {
            setError('Please enter insulin units');
            return;
        }

        const dose = parseFloat(units);
        if (isNaN(dose) || dose <= 0) {
            setError('Please enter a valid dose');
            return;
        }

        // Get current glucose (TODO: fetch from latest log)
        const currentGlucose = route.params?.currentGlucose || 120;

        // Fetch recent insulin history (simplified for now)
        const insulinHistory = []; // Will be populated from Firestore

        const result = checkDoseSafety(dose, currentGlucose, insulinHistory);
        setSafetyCheck(result);
        setError('');
    };

    const handleSave = async () => {
        if (!safetyCheck || !safetyCheck.isSafe) {
            Alert.alert(
                'Safety Warning',
                safetyCheck?.reason || 'Please check dose safety first',
                [{ text: 'OK' }]
            );
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'insulinLogs'), {
                units: parseFloat(units),
                timestamp: serverTimestamp(),
                userId: user?.uid,
                source: 'mobile-app',
                type: 'rapid', // Default type
            });

            Alert.alert('Success', 'Insulin log saved', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err) {
            setError('Failed to save log');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Title style={styles.title}>Log Insulin Dose</Title>

                {/* IOB Display */}
                <Card style={styles.iobCard}>
                    <Card.Content>
                        <Paragraph style={styles.iobLabel}>Active Insulin (IOB)</Paragraph>
                        <Paragraph style={styles.iobValue}>{currentIOB.toFixed(1)} units</Paragraph>
                    </Card.Content>
                </Card>

                {/* Dose Input */}
                <TextInput
                    label="Insulin Units"
                    value={units}
                    onChangeText={setUnits}
                    keyboardType="decimal-pad"
                    mode="outlined"
                    error={!!error}
                    style={styles.input}
                />
                <HelperText type="error" visible={!!error}>
                    {error}
                </HelperText>

                {/* Safety Check Button */}
                <Button
                    mode="outlined"
                    onPress={handleCheckSafety}
                    style={styles.checkButton}
                    icon="shield-check"
                >
                    Check Safety
                </Button>

                {/* Safety Result */}
                {safetyCheck && (
                    <Card style={[
                        styles.safetyCard,
                        safetyCheck.isSafe ? styles.safetyCardSafe : styles.safetyCardUnsafe
                    ]}>
                        <Card.Content>
                            <View style={styles.safetyHeader}>
                                <Chip
                                    mode="flat"
                                    style={safetyCheck.isSafe ? styles.chipSafe : styles.chipUnsafe}
                                >
                                    {safetyCheck.isSafe ? '✓ SAFE' : '⚠ WARNING'}
                                </Chip>
                            </View>
                            <Paragraph style={styles.safetyReason}>{safetyCheck.reason}</Paragraph>
                            {!safetyCheck.isSafe && safetyCheck.allowedDose > 0 && (
                                <Paragraph style={styles.suggestion}>
                                    Suggested max: {safetyCheck.allowedDose.toFixed(1)} units
                                </Paragraph>
                            )}
                        </Card.Content>
                    </Card>
                )}

                {/* Save Button */}
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={loading}
                    disabled={loading || !safetyCheck?.isSafe}
                    style={styles.saveButton}
                >
                    Save Insulin Log
                </Button>
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
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
    },
    iobCard: {
        marginBottom: 20,
        backgroundColor: '#e3f2fd',
    },
    iobLabel: {
        fontSize: 14,
        color: '#666',
    },
    iobValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1976d2',
        marginTop: 4,
    },
    input: {
        marginBottom: 8,
    },
    checkButton: {
        marginTop: 12,
        marginBottom: 20,
    },
    safetyCard: {
        marginBottom: 20,
    },
    safetyCardSafe: {
        backgroundColor: '#e8f5e9',
        borderColor: '#4caf50',
        borderWidth: 2,
    },
    safetyCardUnsafe: {
        backgroundColor: '#fff3e0',
        borderColor: '#ff9800',
        borderWidth: 2,
    },
    safetyHeader: {
        marginBottom: 12,
    },
    chipSafe: {
        backgroundColor: '#4caf50',
    },
    chipUnsafe: {
        backgroundColor: '#ff9800',
    },
    safetyReason: {
        fontSize: 16,
        lineHeight: 24,
    },
    suggestion: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#f57c00',
    },
    saveButton: {
        marginTop: 20,
        paddingVertical: 6,
    },
});
