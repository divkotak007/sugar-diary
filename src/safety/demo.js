/**
 * SAFETY MODULE DEMO & TEST
 * 
 * This file demonstrates how to use the clinical safety module.
 * Run this to test the safety calculations without integrating into the app.
 */

import {
    calculateIOB,
    calculateCOB,
    isSafeToDose,
    canDoseAgain,
    getGlucoseRiskCategory,
    CLINICAL_CONSTANTS
} from './clinical.js';

// ===== TEST DATA =====

// Sample insulin logs (last 4 hours)
const sampleInsulinLogs = [
    {
        timestamp: { seconds: (Date.now() - 1 * 60 * 60 * 1000) / 1000 }, // 1 hour ago
        insulinDoses: {
            'Rapid Acting': 5
        }
    },
    {
        timestamp: { seconds: (Date.now() - 3 * 60 * 60 * 1000) / 1000 }, // 3 hours ago
        insulinDoses: {
            'Rapid Acting': 3
        }
    }
];

// Sample meal logs
const sampleMealLogs = [
    {
        timestamp: { seconds: (Date.now() - 1.5 * 60 * 60 * 1000) / 1000 }, // 1.5 hours ago
        carbs: 60,
        mealType: 'normal'
    }
];

// ===== TEST SCENARIOS =====

console.log('🧪 CLINICAL SAFETY MODULE - TEST SCENARIOS\n');
console.log('='.repeat(60));

// Test 1: IOB Calculation
console.log('\n📊 TEST 1: Insulin on Board (IOB) Calculation');
console.log('-'.repeat(60));
const iob = calculateIOB(sampleInsulinLogs);
console.log(`Current IOB: ${iob.toFixed(2)} units`);
console.log(`Safe limit: ${CLINICAL_CONSTANTS.MAX_SAFE_IOB} units`);
console.log(`Status: ${iob > CLINICAL_CONSTANTS.MAX_SAFE_IOB ? '⚠️ HIGH' : '✅ SAFE'}`);

// Test 2: COB Calculation
console.log('\n🍽️ TEST 2: Carbs on Board (COB) Calculation');
console.log('-'.repeat(60));
const cob = calculateCOB(sampleMealLogs);
console.log(`Current COB: ${cob.toFixed(1)} grams`);
console.log(`Absorption rate: ${CLINICAL_CONSTANTS.CARB_ABSORPTION_RATE}g/hour`);

// Test 3: Glucose Risk Categories
console.log('\n📈 TEST 3: Glucose Risk Categorization');
console.log('-'.repeat(60));
const testGlucoseLevels = [50, 65, 85, 120, 150, 200, 280, 450];
testGlucoseLevels.forEach(hgt => {
    const risk = getGlucoseRiskCategory(hgt);
    console.log(`${hgt} mg/dL → ${risk.emoji} ${risk.label}`);
    console.log(`  Action: ${risk.action}`);
});

// Test 4: Safety Gate - SAFE scenario
console.log('\n✅ TEST 4: Safety Gate - SAFE Scenario');
console.log('-'.repeat(60));
const safeDose = isSafeToDose(150, 1.5, 4);
console.log(`HGT: 150 mg/dL, IOB: 1.5u, Proposed: 4u`);
console.log(`Safe: ${safeDose.safe ? '✅ YES' : '❌ NO'}`);
console.log(`Can Proceed: ${safeDose.canProceed ? '✅ YES' : '❌ NO'}`);
if (safeDose.warnings.length > 0) {
    console.log('Warnings:');
    safeDose.warnings.forEach(w => console.log(`  - ${w}`));
}

// Test 5: Safety Gate - WARNING scenario
console.log('\n⚠️ TEST 5: Safety Gate - WARNING Scenario');
console.log('-'.repeat(60));
const warningDose = isSafeToDose(140, 2.5, 5);
console.log(`HGT: 140 mg/dL, IOB: 2.5u, Proposed: 5u`);
console.log(`Safe: ${warningDose.safe ? '✅ YES' : '❌ NO'}`);
console.log(`Can Proceed: ${warningDose.canProceed ? '✅ YES' : '❌ NO'}`);
if (warningDose.warnings.length > 0) {
    console.log('Warnings:');
    warningDose.warnings.forEach(w => console.log(`  - ${w}`));
}
console.log(`Recommendation: ${warningDose.recommendation}`);

// Test 6: Safety Gate - CRITICAL BLOCK scenario
console.log('\n🛑 TEST 6: Safety Gate - CRITICAL BLOCK Scenario');
console.log('-'.repeat(60));
const criticalDose = isSafeToDose(65, 1.2, 3);
console.log(`HGT: 65 mg/dL, IOB: 1.2u, Proposed: 3u`);
console.log(`Safe: ${criticalDose.safe ? '✅ YES' : '❌ NO'}`);
console.log(`Can Proceed: ${criticalDose.canProceed ? '✅ YES' : '🛑 BLOCKED'}`);
if (criticalDose.criticalWarnings.length > 0) {
    console.log('CRITICAL WARNINGS:');
    criticalDose.criticalWarnings.forEach(w => console.log(`  - ${w}`));
}

// Test 7: Time Interval Check - CAN dose
console.log('\n⏱️ TEST 7: Time Interval Check - CAN Dose');
console.log('-'.repeat(60));
const timeCheckOk = canDoseAgain(sampleInsulinLogs);
console.log(`Last dose: ${timeCheckOk.hoursSince} hours ago`);
console.log(`Can dose again: ${timeCheckOk.can ? '✅ YES' : '❌ NO'}`);
if (!timeCheckOk.can) {
    console.log(`Wait time: ${timeCheckOk.waitMinutes} minutes`);
}

// Test 8: Time Interval Check - CANNOT dose (recent)
console.log('\n⏱️ TEST 8: Time Interval Check - CANNOT Dose');
console.log('-'.repeat(60));
const recentInsulinLogs = [
    {
        timestamp: { seconds: (Date.now() - 30 * 60 * 1000) / 1000 }, // 30 min ago
        insulinDoses: { 'Rapid Acting': 4 }
    }
];
const timeCheckBlocked = canDoseAgain(recentInsulinLogs);
console.log(`Last dose: ${timeCheckBlocked.hoursSince} hours ago`);
console.log(`Can dose again: ${timeCheckBlocked.can ? '✅ YES' : '❌ NO'}`);
if (!timeCheckBlocked.can) {
    console.log(`Wait time: ${timeCheckBlocked.waitMinutes} minutes`);
}

// ===== SUMMARY =====
console.log('\n' + '='.repeat(60));
console.log('✅ ALL TESTS COMPLETE');
console.log('='.repeat(60));
console.log('\nSafety Module Features:');
console.log('  ✓ IOB calculation (exponential decay)');
console.log('  ✓ COB calculation (absorption tracking)');
console.log('  ✓ Glucose risk categorization (7 levels)');
console.log('  ✓ Safety gates (critical/warning/info)');
console.log('  ✓ Time interval validation');
console.log('  ✓ Personalized recommendations');
console.log('\nIntegration Status: ⏳ Ready for optional integration');
console.log('Zero Regression: ✅ No existing code modified\n');
