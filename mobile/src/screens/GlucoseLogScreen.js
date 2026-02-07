import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Title, HelperText } from 'react-native-paper';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function GlucoseLogScreen({ navigation }) {
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!value) {
            setError('Value is required');
            return;
        }

        const glucose = parseFloat(value);
        if (isNaN(glucose) || glucose < 20 || glucose > 600) {
            setError('Please enter a valid glucose level (20-600)');
            return;
        }

        setLoading(true);
        try {
            // TODO: Replace 'userId' with actual user ID from Auth
            await addDoc(collection(db, 'sugarLogs'), {
                value: glucose,
                timestamp: serverTimestamp(),
                userId: 'temp-user-id',
                source: 'mobile-app'
            });
            navigation.goBack();
        } catch (err) {
            setError('Failed to save log');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Log Glucose</Title>

            <TextInput
                label="Glucose (mg/dL)"
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
                mode="outlined"
                error={!!error}
            />
            <HelperText type="error" visible={!!error}>
                {error}
            </HelperText>

            <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                style={styles.button}
            >
                Save Log
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
    },
    button: {
        marginTop: 20,
        paddingVertical: 6,
    }
});
