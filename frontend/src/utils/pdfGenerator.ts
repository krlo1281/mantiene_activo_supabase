
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportData {
    period: string;
    companyName: string;
    rows: {
        workerName: string;
        documentType: string;
        documentNumber: string;
        dosimeterCode: string;
        branchName: string;
        useArea?: string;
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
    const xOffset = (maxWidth - width) / 2;
    doc.addImage(img, format, x + xOffset, y, width, height);
};

const loadAssets = async (doc: jsPDF, pageWidth: number) => {
    try {
        const logo1 = await loadImage("/logo2.png");
        const logo2 = await loadImage("/logo2.png");
        const firmaGerente = await loadImage("/FIRMA_GERENTE.png");
        const firmaDirector = await loadImage("/FIRMA_DIRECTOR.png");

        // --- HEADER DUAL ---
        addImageWithRatio(doc, logo1, 'PNG', 14, 10, 60, 22.5);
        addImageWithRatio(doc, logo2, 'WEBP', pageWidth - 54, 10, 40, 15);

        return { firmaGerente, firmaDirector };
    } catch (e) {
        console.error("Error loading assets", e);
        return { firmaGerente: null, firmaDirector: null };
    }
};

export const generateMonthlyReportDict = async (data: ReportData) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.width;

    const { firmaGerente, firmaDirector } = await loadAssets(doc, pageWidth);

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

    const maxWidth = pageWidth - 50; 
    const companyText = data.companyName.toUpperCase();
    const splitTitle = doc.splitTextToSize(companyText, maxWidth);
    doc.text(splitTitle, 35, 35);

    const nextY = 35 + (splitTitle.length * 5);

    doc.setFont("helvetica", "bold");
    doc.text("PERIODO:", 14, nextY);
    doc.setFont("helvetica", "normal");
    doc.text(data.period, 35, nextY);

    doc.setFont("helvetica", "bold");
    doc.text("CANTIDAD DE USUARIOS:", 14, nextY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(`${data.rows.length}`, 65, nextY + 5);

    // --- TABLE ---
    const tableHeaders = [
        [
            { content: 'IDENTIFICACIÓN', colSpan: 2, styles: { halign: 'center' as const } },
            { content: 'DOSIS DEL MES [mSv]', colSpan: 2, styles: { halign: 'center' as const } },
            { content: 'DOSIS ACUMULADA ANUAL [mSv]', colSpan: 2, styles: { halign: 'center' as const } },
            { content: 'DOSIMETRO EN EL TIEMPO', colSpan: 3, styles: { halign: 'center' as const } }
        ],
        [
            { content: 'DOC', styles: { halign: 'center' as const } },
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
    const periodParts = data.period.split(" ");
    const periodMonth = periodParts.length > 0 ? periodParts[0] : "";
    const periodYear = periodParts.length > 1 ? periodParts[1] : "";

    const sortedRows = [...data.rows].sort((a, b) => {
        if (a.branchName < b.branchName) return -1;
        if (a.branchName > b.branchName) return 1;
        if (a.workerName < b.workerName) return -1;
        if (a.workerName > b.workerName) return 1;
        return 0;
    });

    let currentBranch = "";
    sortedRows.forEach(row => {
        if (row.branchName && row.branchName !== currentBranch) {
            currentBranch = row.branchName;
            tableRows.push([
                {
                    content: `SEDE: ${currentBranch.toUpperCase()}`,
                    colSpan: 9,
                    styles: {
                        halign: 'left' as const,
                        fillColor: [240, 240, 240],
                        fontStyle: 'bold',
                        textColor: [50, 50, 50]
                    }
                }
            ]);
        }

        const workerNameBlock = row.useArea 
            ? `${row.workerName.toUpperCase()}\nÃREA: ${row.useArea.toUpperCase()}`
            : row.workerName.toUpperCase();

        const readingData = [
            row.documentNumber,
            workerNameBlock,
            typeof row.hp10 === 'number' ? row.hp10.toFixed(4) : row.hp10,
            typeof row.hp007 === 'number' ? row.hp007.toFixed(4) : row.hp007,
            typeof row.accumulatedHp10 === 'number' ? row.accumulatedHp10.toFixed(4) : row.accumulatedHp10 || 0,
            typeof row.accumulatedHp007 === 'number' ? row.accumulatedHp007.toFixed(4) : row.accumulatedHp007 || 0,
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
            0: { cellWidth: 20, halign: 'center' as const },
            1: { cellWidth: 'auto', halign: 'left' as const },
            2: { cellWidth: 25, halign: 'center' as const },
            3: { cellWidth: 25, halign: 'center' as const },
            4: { cellWidth: 25, halign: 'center' as const },
            5: { cellWidth: 25, halign: 'center' as const },
            6: { cellWidth: 20, halign: 'center' as const },
            7: { cellWidth: 15, halign: 'center' as const },
            8: { cellWidth: 15, halign: 'center' as const }
        },
        alternateRowStyles: {
            fillColor: [240, 253, 244]
        },
        margin: { top: 53, bottom: 40 }
    });

    // --- FOOTER (SIGNATURES) ---
    const tableEndY = (doc as any).lastAutoTable.finalY;
    const spacingNeeded = 35; // Espacio mínimo entre tabla y firmas
    const finalY = tableEndY + spacingNeeded;

    if (firmaGerente) {
        addImageWithRatio(doc, firmaGerente, 'PNG', 30, finalY - 25, 70, 25);
    }
    doc.setDrawColor(0);
    doc.line(30, finalY, 100, finalY);
    doc.setFontSize(8);
    doc.text("Gerente General", 65, finalY + 5, { align: "center" });

    if (firmaDirector) {
        addImageWithRatio(doc, firmaDirector, 'PNG', pageWidth - 100, finalY - 25, 70, 25);
    }
    doc.line(pageWidth - 100, finalY, pageWidth - 30, finalY);
    doc.text("Dirección de Laboratorio", pageWidth - 65, finalY + 5, { align: "center" });

    doc.save(`Reporte_Mensual_${data.period.replace(/\//g, "-")}_${data.companyName.replace(/ /g, "_")}.pdf`);
};

export const generateStructurePreview = async () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const { firmaGerente, firmaDirector } = await loadAssets(doc, pageWidth);

    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME MENSUAL DE DOSIMETRIA PERSONAL", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE:", 14, 35);
    doc.setFont("helvetica", "normal");
    doc.text("EMPRESA DE EJEMPLO S.A.C.", 35, 35);

    doc.text("CANTIDAD DE USUARIOS:", 14, 45);
    doc.text("15", 65, 45);

    const structureHeaders = [
        [
            { content: 'IDENTIFICACIÓN', colSpan: 2, styles: { halign: 'center' as const } },
            { content: 'DOSIS DEL MES [mSv]', colSpan: 2, styles: { halign: 'center' as const } },
            { content: 'DOSIS ANUAL [mSv]', colSpan: 2, styles: { halign: 'center' as const } },
            { content: 'DOSIMETRO EN EL TIEMPO', colSpan: 3, styles: { halign: 'center' as const } }
        ],
        [
            { content: 'DOC', styles: { halign: 'center' as const } },
            { content: 'APELLIDOS Y NOMBRES', styles: { halign: 'left' as const } },
            { content: 'EFECTIVA', styles: { halign: 'center' as const } },
            { content: 'PIEL', styles: { halign: 'center' as const } },
            { content: 'EFECTIVA', styles: { halign: 'center' as const } },
            { content: 'PIEL', styles: { halign: 'center' as const } },
            { content: 'MES', styles: { halign: 'center' as const } },
            { content: 'NÂ° DE MESES', styles: { halign: 'center' as const } },
            { content: 'AÑO', styles: { halign: 'center' as const } }
        ]
    ];

    const tableRows = [
        ["12345678", "APELLIDO PATERNO MATERNO, NOMBRES\nÃREA: RADIOLOGÍA", "0.1500", "0.1800", "1.500", "1.800", "ENERO", "12", "2024"],
        ["87654321", "APELLIDO PATERNO MATERNO, NOMBRES\nÃREA: ODONTOLOGÍA", "0.0000", "0.0000", "0.500", "0.600", "ENERO", "5", "2024"],
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
            0: { cellWidth: 20, halign: 'center' as const },
            1: { cellWidth: 'auto', halign: 'left' as const },
            2: { cellWidth: 25, halign: 'center' as const },
            3: { cellWidth: 25, halign: 'center' as const },
            4: { cellWidth: 25, halign: 'center' as const },
            5: { cellWidth: 25, halign: 'center' as const },
            6: { cellWidth: 20, halign: 'center' as const },
            7: { cellWidth: 15, halign: 'center' as const },
            8: { cellWidth: 15, halign: 'center' as const }
        },
        alternateRowStyles: {
            fillColor: [240, 253, 244]
        },
        margin: { top: 53, bottom: 40 }
    });

    const finalY = pageHeight - 30;

    if (firmaGerente) {
        addImageWithRatio(doc, firmaGerente, 'PNG', 30, finalY - 25, 70, 25);
    }
    doc.setDrawColor(0);
    doc.line(30, finalY, 100, finalY);
    doc.setFontSize(8);
    doc.text("Gerente General", 65, finalY + 5, { align: "center" });

    if (firmaDirector) {
        addImageWithRatio(doc, firmaDirector, 'PNG', pageWidth - 100, finalY - 25, 70, 25);
    }
    doc.line(pageWidth - 100, finalY, pageWidth - 30, finalY);
    doc.text("Dirección de Laboratorio", pageWidth - 65, finalY + 5, { align: "center" });

    doc.setFontSize(7);
    doc.text("Leyenda: M = Mínimo Detectable", 14, pageHeight - 10);

    doc.save("Estructura_Reporte_Clinico.pdf");
};
