
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportData {
    period: string;
    companyName: string;
    rows: {
        workerName: string;
        dni: string;
        dosimeterCode: string;
        hp10: number | string;
        hp007: number | string;
        accumulatedHp10?: number | string;
        accumulatedHp007?: number | string;
        accumulatedMonths?: number;
        notes: string;
    }[];
}


const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
};

const addImageWithRatio = (doc: jsPDF, img: HTMLImageElement, format: string, x: number, y: number, maxWidth: number, maxHeight: number) => {
    const ratio = img.width / img.height;
    let width = maxWidth;
    let height = width / ratio;
    if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
    }
    doc.addImage(img, format, x, y, width, height);
};

export const generateMonthlyReportDict = async (data: ReportData) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Load Logos
    try {
        const logo1 = await loadImage("/logo.png");
        const logo2 = await loadImage("/OIP.webp");

        // --- HEADER DUAL ---
        // Left Logo (C&D CALIDOSE)
        addImageWithRatio(doc, logo1, 'PNG', 14, 10, 60, 22.5);

        // Right Logo (myOSL DOSIMETER)
        addImageWithRatio(doc, logo2, 'WEBP', pageWidth - 54, 10, 40, 15);
    } catch (e) {
        console.error("Error loading logos", e);
        // Fallback or just continue without logos
    }

    // Center Title
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME MENSUAL DE DOSIMETRIA PERSONAL", pageWidth / 2, 20, { align: "center" });

    // --- CLIENT INFO BLOCK ---
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE:", 14, 35);
    doc.setFont("helvetica", "normal");

    // Wrap text if too long
    const maxWidth = pageWidth - 50; // Leave some margin
    const companyText = data.companyName.toUpperCase();
    const splitTitle = doc.splitTextToSize(companyText, maxWidth);
    doc.text(splitTitle, 35, 35);

    // Adjust Y position for next elements based on how many lines the company name took
    const nextY = 35 + (splitTitle.length * 5); // 5 is approx line height for font size 9

    doc.setFont("helvetica", "bold");
    doc.text("PERIODO:", 14, nextY);
    doc.setFont("helvetica", "normal");
    doc.text(data.period, 35, nextY);

    doc.setFont("helvetica", "bold");
    doc.text("CANTIDAD DE USUARIOS:", 14, nextY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(`${data.rows.length}`, 65, nextY + 5);

    // --- COMPLEX TABLE ---
    const tableHeaders = [
        [
            { content: 'IDENTIFICACIÓN', colSpan: 2, styles: { halign: 'center' as const } },
            { content: 'DOSIS DEL MES [mSv]', colSpan: 2, styles: { halign: 'center' as const } },
            { content: 'DOSIS ACUMULADA ANUAL [mSv]', colSpan: 2, styles: { halign: 'center' as const } },
            { content: 'DOSIMETRO EN EL TIEMPO', colSpan: 3, styles: { halign: 'center' as const } }
        ],
        [
            { content: 'DNI', styles: { halign: 'center' as const } },
            { content: 'USUARIO', styles: { halign: 'left' as const } },
            { content: 'EFECTIVA', styles: { halign: 'center' as const } },
            { content: 'PIEL', styles: { halign: 'center' as const } },
            { content: 'EFECTIVA', styles: { halign: 'center' as const } },
            { content: 'PIEL', styles: { halign: 'center' as const } },
            { content: 'MES', styles: { halign: 'center' as const } },
            { content: 'MESES ACUM.', styles: { halign: 'center' as const } },
            { content: 'AÑO', styles: { halign: 'center' as const } }
        ]
    ];

    const tableRows: any[] = [];

    // Parse Period from data.period string (e.g. "Enero 2024") to get Month and Year separately
    const periodParts = data.period.split(" ");
    const periodMonth = periodParts.length > 0 ? periodParts[0] : "";
    const periodYear = periodParts.length > 1 ? periodParts[1] : "";

    data.rows.forEach(row => {
        // Mocking missing data for now
        const readingData = [
            row.dni,
            row.workerName.toUpperCase(),
            // REMOVED SEX
            // REMOVED SEX
            typeof row.hp10 === 'number' ? row.hp10.toFixed(4) : row.hp10,
            typeof row.hp007 === 'number' ? row.hp007.toFixed(4) : row.hp007,
            // Accumulated Annual Dose (Rolling 12 months)
            typeof row.accumulatedHp10 === 'number' ? row.accumulatedHp10.toFixed(4) : row.accumulatedHp10 || 0,
            typeof row.accumulatedHp007 === 'number' ? row.accumulatedHp007.toFixed(4) : row.accumulatedHp007 || 0,
            // Time Control
            periodMonth.toUpperCase(),
            row.accumulatedMonths || 0,
            periodYear
        ];
        tableRows.push(readingData);
    });

    autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: nextY + 10,
        theme: 'plain',
        styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: 'center' as const,
        },
        headStyles: {
            fillColor: [22, 163, 74],
            textColor: 255,
            fontStyle: 'bold',
            valign: 'middle',
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
            halign: 'center' as const
        },
        columnStyles: {
            0: { cellWidth: 20, halign: 'center' as const }, // DNI
            1: { cellWidth: 'auto', halign: 'left' as const }, // Usuario
            2: { cellWidth: 25, halign: 'center' as const }, // Efec Mes
            3: { cellWidth: 25, halign: 'center' as const }, // Piel Mes
            4: { cellWidth: 25, halign: 'center' as const }, // Efec Anual
            5: { cellWidth: 25, halign: 'center' as const }, // Piel Anual
            6: { cellWidth: 20, halign: 'center' as const }, // Mes
            7: { cellWidth: 15, halign: 'center' as const }, // Count
            8: { cellWidth: 15, halign: 'center' as const }  // Año
        },
        alternateRowStyles: {
            fillColor: [240, 253, 244]
        },
        margin: { top: 53, bottom: 40 } // Increased top margin
    });

    // --- FOOTER (SIGNATURES) ---
    const finalY = pageHeight - 30; // 30 units from bottom

    // Left Signature Line
    doc.setDrawColor(0);
    doc.line(40, finalY, 100, finalY);
    doc.setFontSize(8);
    doc.text("Gerente General", 70, finalY + 5, { align: "center" });

    // Right Signature Line
    doc.line(pageWidth - 100, finalY, pageWidth - 40, finalY);
    doc.text("Dirección de Laboratorio", pageWidth - 70, finalY + 5, { align: "center" });

    // Save the PDF
    doc.save(`Reporte_Mensual_${data.period.replace(/\//g, "-")}_${data.companyName.replace(/ /g, "_")}.pdf`);
};

export const generateStructurePreview = async () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Load Logos
    try {
        const logo1 = await loadImage("/logo.png");
        const logo2 = await loadImage("/OIP.webp");

        // --- HEADER DUAL ---
        addImageWithRatio(doc, logo1, 'PNG', 14, 10, 60, 22.5);
        addImageWithRatio(doc, logo2, 'WEBP', pageWidth - 54, 10, 40, 15);
    } catch (e) {
        console.error("Error loading logos", e);
    }

    // Center Title
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME MENSUAL DE DOSIMETRIA PERSONAL", pageWidth / 2, 20, { align: "center" });

    // --- CLIENT INFO BLOCK ---
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE:", 14, 35);
    doc.setFont("helvetica", "normal");
    doc.text("EMPRESA DE EJEMPLO S.A.C.", 35, 35);

    doc.text("CANTIDAD DE USUARIOS:", 14, 45); // Adjusted Y
    doc.text("15", 65, 45);

    // --- COMPLEX TABLE ---
    const structureHeaders = [
        [
            { content: 'IDENTIFICACIÓN', colSpan: 2, styles: { halign: 'center' as const } },
            { content: 'DOSIS DEL MES [mSv]', colSpan: 2, styles: { halign: 'center' as const } },
            { content: 'DOSIS ANUAL [mSv]', colSpan: 2, styles: { halign: 'center' as const } },
            { content: 'DOSIMETRO EN EL TIEMPO', colSpan: 3, styles: { halign: 'center' as const } }
        ],
        [
            { content: 'DNI', styles: { halign: 'center' as const } },
            { content: 'APELLIDOS Y NOMBRES', styles: { halign: 'left' as const } },
            { content: 'EFECTIVA', styles: { halign: 'center' as const } },
            { content: 'PIEL', styles: { halign: 'center' as const } },
            { content: 'EFECTIVA', styles: { halign: 'center' as const } },
            { content: 'PIEL', styles: { halign: 'center' as const } },
            { content: 'MES', styles: { halign: 'center' as const } },
            { content: 'N° DE MESES', styles: { halign: 'center' as const } },
            { content: 'AÑO', styles: { halign: 'center' as const } }
        ]
    ];

    const tableRows = [
        ["12345678", "APELLIDO PATERNO MATERNO, NOMBRES", "0.1500", "0.1800", "1.500", "1.800", "ENERO", "12", "2024"],
        ["87654321", "APELLIDO PATERNO MATERNO, NOMBRES", "0.0000", "0.0000", "0.500", "0.600", "ENERO", "5", "2024"],
        ["", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", ""],
    ];

    autoTable(doc, {
        head: structureHeaders,
        body: tableRows,
        startY: 53,
        theme: 'plain',
        styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: 'center' as const
        },
        headStyles: {
            fillColor: [22, 163, 74],
            textColor: 255,
            fontStyle: 'bold',
            valign: 'middle',
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
            halign: 'center' as const
        },
        columnStyles: {
            0: { cellWidth: 20, halign: 'center' as const }, // DNI
            1: { cellWidth: 'auto', halign: 'left' as const }, // Usuario
            2: { cellWidth: 25, halign: 'center' as const }, // Efec Mes
            3: { cellWidth: 25, halign: 'center' as const }, // Piel Mes
            4: { cellWidth: 25, halign: 'center' as const }, // Efec Anual
            5: { cellWidth: 25, halign: 'center' as const }, // Piel Anual
            6: { cellWidth: 20, halign: 'center' as const }, // Mes
            7: { cellWidth: 15, halign: 'center' as const }, // Count
            8: { cellWidth: 15, halign: 'center' as const }  // Año
        },
        alternateRowStyles: {
            fillColor: [240, 253, 244]
        },
        margin: { top: 53, bottom: 40 }
    });

    // --- FOOTER (SIGNATURES) ---
    const finalY = pageHeight - 30; // 30 units from bottom

    // Left Signature Line
    doc.setDrawColor(0);
    doc.line(40, finalY, 100, finalY);
    doc.setFontSize(8);
    doc.text("Gerente General", 70, finalY + 5, { align: "center" });

    // Right Signature Line
    doc.line(pageWidth - 100, finalY, pageWidth - 40, finalY);
    doc.text("Dirección de Laboratorio", pageWidth - 70, finalY + 5, { align: "center" });

    // Legend
    doc.setFontSize(7);
    doc.text("Leyenda: M = Mínimo Detectable", 14, pageHeight - 10);

    doc.save("Estructura_Reporte_Clinico.pdf");
};
