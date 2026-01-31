import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generatePDFReport = async ({
    user,
    profile,
    prescription,
    compliance,
    fullHistory,
    pdfStartDate,
    pdfEndDate,
    trendData
}) => {

    const doc = new jsPDF();
    const runAutoTable = (options) => {
        if (doc.autoTable) doc.autoTable(options);
        else console.error("AutoTable not available");
    };

    doc.setFillColor(5, 150, 105); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255); doc.setFontSize(22); doc.text("SugarDiary Report", 14, 22);
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(`Patient: ${user.displayName || 'User'}`, 14, 32);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 37);
    doc.setTextColor(0);

    const vitalsHead = ['Age', 'Gender', 'Weight', 'HbA1c', 'Creatinine'];
    const vitalsBody = [profile.age, profile.gender || '-', profile.weight, profile.hba1c, profile.creatinine];
    if (profile.gender === 'Female' && profile.pregnancyStatus) { vitalsHead.push('Pregnancy'); vitalsBody.push('YES (High Risk)'); }
    runAutoTable({ startY: 45, head: [vitalsHead], body: [vitalsBody] });

    if (profile.comorbidities?.length > 0) {
        runAutoTable({ startY: (doc.lastAutoTable || {}).finalY + 5, head: [['Known Comorbidities']], body: [[profile.comorbidities.join(', ')]], theme: 'plain', styles: { fontSize: 9, fontStyle: 'italic', cellPadding: 2 } });
    }

    let finalY = (doc.lastAutoTable || {}).finalY + 10;
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Vital Trends", 14, finalY);

    // Graph Drawing Logic
    const drawGraph = (data, title, startX, startY, width, height, norm, color) => {
        if (!data || data.length < 2) return;

        const gX = startX; const gY = startY + 6;
        doc.setFontSize(9); doc.setTextColor(60); doc.setFont("helvetica", "bold"); doc.text(title, startX, startY + 4);

        const vals = data.map(d => d.value);
        const dataMin = Math.min(...vals);
        const dataMax = Math.max(...vals);
        const dataRange = (dataMax - dataMin) || (dataMax * 0.1) || 1;

        let min = dataMin - (dataRange * 0.4);
        let max = dataMax + (dataRange * 0.4);
        const range = max - min;

        if (title.includes("HbA1c")) {
            const getY = (val) => gY + height - ((val - min) / range) * height;
            doc.setFillColor(240, 253, 244);
            const y57 = Math.max(gY, Math.min(gY + height, getY(5.7)));
            doc.rect(gX, y57, width, (gY + height) - y57, 'F');

            doc.setFillColor(255, 251, 235);
            const y65 = Math.max(gY, Math.min(gY + height, getY(6.5)));
            doc.rect(gX, y65, width, y57 - y65, 'F');

            doc.setFillColor(254, 242, 242);
            doc.rect(gX, gY, width, y65 - gY, 'F');
        }

        doc.setDrawColor(240); doc.setLineWidth(0.1);
        [0.25, 0.5, 0.75].forEach(r => { doc.line(gX, gY + height * r, gX + width, gY + height * r); });

        if (norm) {
            const refY = gY + height - ((norm - min) / range) * height;
            if (refY >= gY && refY <= gY + height) {
                doc.setDrawColor(200); doc.setLineDashPattern([1, 1], 0); doc.line(gX, refY, gX + width, refY);
                doc.setLineDashPattern([], 0);
            }
        }

        const [r, g, b] = color === 'orange' ? [234, 88, 12] : color === 'purple' ? [147, 51, 234] : [5, 150, 105];

        let pdfPoints = [];
        if (data.length <= 5) {
            pdfPoints = data;
        } else {
            pdfPoints = [data[0], ...data.slice(-4)];
        }

        pdfPoints.forEach((d, i) => {
            const x = gX + i / (pdfPoints.length - 1 === 0 ? 1 : pdfPoints.length - 1) * width;
            const y = gY + height - ((d.value - min) / range) * height;

            if (i > 0) {
                const prev = pdfPoints[i - 1];
                const x1 = gX + (i - 1) / (pdfPoints.length - 1) * width;
                const y1 = gY + height - ((prev.value - min) / range) * height;
                doc.setDrawColor(r, g, b); doc.setLineWidth(1.2); doc.line(x1, y1, x, y);
            }

            doc.setFillColor(r, g, b); doc.circle(x, y, 1.5, 'F');
            doc.setFontSize(8); doc.setTextColor(40); doc.setFont("helvetica", "bold");
            doc.text(d.value.toString(), x, y - 4, { align: 'center' });
            doc.setFontSize(5); doc.setTextColor(180); doc.setFont("helvetica", "normal");
            doc.text(new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), x, gY + height + 4, { align: 'center' });
        });
    };

    const gW = 60; const gH = 32;
    drawGraph(trendData.weight || [], "Weight (kg)", 14, finalY, gW, gH, null, 'orange');
    drawGraph(trendData.hba1c || [], "HbA1c (%)", 14 + gW + 5, finalY, gW, gH, 5.7, 'emerald');
    drawGraph(trendData.creatinine || [], "Creatinine", 14 + (gW + 5) * 2, finalY, gW, gH, 1.2, 'purple');
    finalY += gH + 25;

    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("Prescription", 14, finalY);
    const insulinRows = (prescription.insulins || []).map(i => [i.name, i.type, i.frequency || '-', (i.slidingScale || []).map(s => `${s.min}-${s.max}:${s.dose}u`).join(' | ') || 'Fixed']);
    runAutoTable({ startY: finalY + 5, head: [['Insulin', 'Type', 'Freq', 'Scale']], body: insulinRows });
    finalY = (doc.lastAutoTable || {}).finalY + 5;
    const oralRows = (prescription.oralMeds || []).map(m => [m.name, m.dose, m.frequency, m.timings.join(', ')]);
    runAutoTable({ startY: finalY, head: [['Drug', 'Dose', 'Freq', 'Timings']], body: oralRows });

    finalY = (doc.lastAutoTable || {}).finalY + 15;

    if (finalY > 260 && profile.instructions) { doc.addPage(); finalY = 20; }

    // Filtering history
    const pdfFilteredHistory = (fullHistory || []).filter(l => {
        if (l.type === 'vital_update' || l.type === 'prescription_update') return false;
        const d = new Date(l.timestamp?.seconds * 1000 || l.timestamp);
        if (pdfStartDate && d < new Date(pdfStartDate)) return false;
        if (pdfEndDate) { const end = new Date(pdfEndDate); end.setHours(23, 59, 59, 999); if (d > end) return false; }
        return true;
    });

    if (profile.instructions) {
        doc.setFontSize(12); doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.text("Medical Instructions", 14, finalY);
        doc.setFontSize(10); doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(profile.instructions, 180);
        doc.text(splitText, 14, finalY + 8);
        finalY += (splitText.length * 6) + 15;
    }

    if (finalY > 260) { doc.addPage(); finalY = 20; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("Logbook", 14, finalY);

    const logRows = pdfFilteredHistory
        .filter(l => {
            const hasSugar = l.hgt && !isNaN(parseFloat(l.hgt));
            const hasMeds = l.medsTaken && l.medsTaken.length > 0;
            const hasInsulin = l.insulinDoses && Object.keys(l.insulinDoses).length > 0;
            const hasTags = l.tags && l.tags.length > 0;
            return hasSugar || hasMeds || hasInsulin || hasTags;
        })
        .map(l => [
            new Date(l.timestamp?.seconds * 1000 || l.timestamp).toLocaleString(),
            l.hgt || '-',
            l.mealStatus,
            Object.entries(l.insulinDoses || {}).map(([id, d]) => `${(prescription.insulins || []).find(i => i.id === id)?.name || 'Ins'}: ${d}u`).join(', '),
            (l.tags || []).join(', ')
        ]);
    runAutoTable({ startY: finalY + 5, head: [['Time', 'Sugar', 'Context', 'Insulin', 'Notes']], body: logRows });

    finalY = (doc.lastAutoTable || {}).finalY + 15;
    doc.setFillColor(245, 247, 250); doc.rect(14, finalY, 182, 20, 'F');
    doc.setFontSize(10); doc.setTextColor(80); doc.setFont("helvetica", "bold");
    doc.text("Medication Compliance Summary (7-Day Trend)", 20, finalY + 8);

    doc.setFontSize(9);
    doc.setTextColor(5, 150, 105); doc.text(`Oral: ${compliance.oral}%`, 20, finalY + 16);
    doc.setTextColor(37, 99, 235); doc.text(`Insulin: ${compliance.insulin}%`, 60, finalY + 16);
    doc.setTextColor(15, 23, 42); doc.text(`Overall Compliance Score: ${compliance.overall}%`, 110, finalY + 16);

    try { doc.save("SugarDiary_Report.pdf"); } catch (e) { alert("Failed to save PDF. Please try again."); }
};
