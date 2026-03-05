
import { useState } from "react";
import DosimeterQR from "../components/DosimeterQR";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const QRTest = () => {
    const [name, setName] = useState("JUAN PEREZ");
    const [period, setPeriod] = useState("OCTUBRE 2023");
    const [code, setCode] = useState("DOS-001");

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold mb-4">Generador de QR - POC</h1>

            <div className="grid gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="grid gap-2">
                    <Label>Nombre del Usuario</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: JUAN PEREZ"
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Periodo</Label>
                    <Input
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        placeholder="Ej: OCTUBRE 2023"
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Código Dosímetro</Label>
                    <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Ej: DOS-001"
                    />
                </div>
            </div>

            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-gray-50/50">
                <h2 className="text-lg font-semibold mb-4 text-gray-500">Vista Previa</h2>
                <DosimeterQR
                    workerName={name}
                    period={period}
                    dosimeterCode={code}
                    size={100}
                />
            </div>
        </div>
    );
};

export default QRTest;
