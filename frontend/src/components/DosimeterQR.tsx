import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface DosimeterQRProps {
    workerName: string;
    period: string;
    dosimeterCode: string;
    size?: number;
}

const DosimeterQR: React.FC<DosimeterQRProps> = ({
    workerName,
    period,
    dosimeterCode,
    size = 128
}) => {
    // Construct the data string. Using a pipe delimited format.
    // Format: DNI|WORKER_NAME|PERIOD|DOSIMETER_CODE
    // We don't have DNI in props yet, let's just use what we have or accept it as prop.
    // For now, based on requirements: "asignacion de nombre del usuario, periodo de asignacion y codigo de dosimetro asignado"

    const qrData = `${workerName}|${period}|${dosimeterCode}`;

    return (
        <div className="flex flex-col items-center p-4 border rounded-lg bg-white shadow-sm">
            <QRCodeSVG
                value={qrData}
                size={size}
                level={"L"}
                includeMargin={true}
            />
            <div className="mt-2 text-xs text-center text-gray-500 font-mono">
                {dosimeterCode}
            </div>
        </div>
    );
};

export default DosimeterQR;
