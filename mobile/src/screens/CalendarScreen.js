import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from 'date-fns';

export default function CalendarScreen({ route }) {
    const user = route.params?.user;
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [glucoseData, setGlucoseData] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        if (user?.uid) {
            fetchMonthData();
        }
    }, [currentMonth, user]);

    const fetchMonthData = async () => {
        setLoading(true);
        try {
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);

            const q = query(
                collection(db, 'sugarLogs'),
                where('userId', '==', user?.uid),
                where('timestamp', '>=', Timestamp.fromDate(monthStart)),
                where('timestamp', '<=', Timestamp.fromDate(monthEnd))
            );

            const snapshot = await getDocs(q);
            const logs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().timestamp?.toDate()
            }));

            // Group by date and calculate averages
            const grouped = {};
            logs.forEach(log => {
                if (!log.date) return;
                const dateKey = format(log.date, 'yyyy-MM-dd');
                if (!grouped[dateKey]) {
                    grouped[dateKey] = { values: [], count: 0, sum: 0 };
                }
                grouped[dateKey].values.push(log.value);
                grouped[dateKey].sum += log.value;
                grouped[dateKey].count++;
            });

            // Calculate averages and determine status
            Object.keys(grouped).forEach(dateKey => {
                const data = grouped[dateKey];
                data.average = Math.round(data.sum / data.count);
                data.status = getGlucoseStatus(data.average);
            });

            setGlucoseData(grouped);
        } catch (error) {
            console.error('Error fetching calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGlucoseStatus = (avg) => {
        if (avg < 70) return 'low';
        if (avg > 180) return 'high';
        return 'normal';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'low': return '#ff5252';
            case 'high': return '#ffa726';
            case 'normal': return '#66bb6a';
            default: return '#e0e0e0';
        }
    };

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Get first day of month to calculate offset
        const firstDayOfWeek = monthStart.getDay();

        return (
            <View style={styles.calendar}>
                {/* Weekday headers */}
                <View style={styles.weekRow}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <Text key={day} style={styles.weekDay}>{day}</Text>
                    ))}
                </View>

                {/* Calendar grid */}
                <View style={styles.daysGrid}>
                    {/* Empty cells for offset */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <View key={`empty-${i}`} style={styles.dayCell} />
                    ))}

                    {/* Actual days */}
                    {days.map(day => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayData = glucoseData[dateKey];
                        const isToday = isSameDay(day, new Date());
                        const isSelected = selectedDate && isSameDay(day, selectedDate);

                        return (
                            <TouchableOpacity
                                key={dateKey}
                                style={[
                                    styles.dayCell,
                                    isToday && styles.today,
                                    isSelected && styles.selected
                                ]}
                                onPress={() => setSelectedDate(day)}
                            >
                                <Text style={[styles.dayNumber, isToday && styles.todayText]}>
                                    {format(day, 'd')}
                                </Text>
                                {dayData && (
                                    <View
                                        style={[
                                            styles.indicator,
                                            { backgroundColor: getStatusColor(dayData.status) }
                                        ]}
                                    >
                                        <Text style={styles.indicatorText}>{dayData.average}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderSelectedDayDetails = () => {
        if (!selectedDate) return null;

        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        const dayData = glucoseData[dateKey];

        if (!dayData) {
            return (
                <Card style={styles.detailsCard}>
                    <Card.Content>
                        <Paragraph>No data for {format(selectedDate, 'MMM d, yyyy')}</Paragraph>
                    </Card.Content>
                </Card>
            );
        }

        return (
            <Card style={styles.detailsCard}>
                <Card.Content>
                    <Title>{format(selectedDate, 'MMMM d, yyyy')}</Title>
                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statLabel}>Average</Text>
                            <Text style={[styles.statValue, { color: getStatusColor(dayData.status) }]}>
                                {dayData.average} mg/dL
                            </Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statLabel}>Readings</Text>
                            <Text style={styles.statValue}>{dayData.count}</Text>
                        </View>
                    </View>
                    <View style={styles.rangeRow}>
                        <Text style={styles.rangeLabel}>Range:</Text>
                        <Text style={styles.rangeValue}>
                            {Math.min(...dayData.values)} - {Math.max(...dayData.values)} mg/dL
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Month Navigation */}
                <View style={styles.monthNav}>
                    <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <Text style={styles.navButton}>← Prev</Text>
                    </TouchableOpacity>
                    <Title>{format(currentMonth, 'MMMM yyyy')}</Title>
                    <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <Text style={styles.navButton}>Next →</Text>
                    </TouchableOpacity>
                </View>

                {/* Legend */}
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#66bb6a' }]} />
                        <Text style={styles.legendText}>Normal (70-180)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#ff5252' }]} />
                        <Text style={styles.legendText}>Low (&lt;70)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#ffa726' }]} />
                        <Text style={styles.legendText}>High (&gt;180)</Text>
                    </View>
                </View>

                {/* Calendar */}
                {loading ? (
                    <ActivityIndicator size="large" style={styles.loader} />
                ) : (
                    renderCalendar()
                )}

                {/* Selected Day Details */}
                {renderSelectedDayDetails()}
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
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    navButton: {
        fontSize: 16,
        color: '#6200ee',
        fontWeight: 'bold',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
    },
    calendar: {
        marginBottom: 16,
    },
    weekRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekDay: {
        flex: 1,
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#666',
        fontSize: 12,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    today: {
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
    },
    selected: {
        borderWidth: 2,
        borderColor: '#6200ee',
        borderRadius: 8,
    },
    dayNumber: {
        fontSize: 14,
        marginBottom: 2,
    },
    todayText: {
        fontWeight: 'bold',
        color: '#6200ee',
    },
    indicator: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 40,
    },
    indicatorText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    detailsCard: {
        marginTop: 16,
        elevation: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
    },
    stat: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    rangeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    rangeLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    rangeValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    loader: {
        marginTop: 40,
    },
});
