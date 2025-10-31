import React, { useState } from 'react';
import type { Acolhida, Group } from '../types';
import { XIcon, UploadIcon } from './Icons';

interface ImportModalProps {
    onClose: () => void;
    onImport: (acolhidas: Omit<Acolhida, 'id'>[]) => void;
}

const parseCSV = (text: string): Omit<Acolhida, 'id'>[] => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
        throw new Error("O arquivo CSV está vazio ou contém apenas o cabeçalho.");
    }
    
    const header = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['name', 'startDate', 'groups'];
    
    for (const req of requiredHeaders) {
        if (!header.includes(req)) {
            throw new Error(`Arquivo CSV inválido. A coluna obrigatória "${req}" não foi encontrada.`);
        }
    }

    const acolhidasData: Omit<Acolhida, 'id'>[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        // This is a simple parser, it won't handle commas inside quoted strings.
        const rowData: { [key: string]: string } = {};
        header.forEach((h, index) => {
            rowData[h] = values[index]?.trim() || '';
        });

        if (!rowData.name || !rowData.startDate || !rowData.groups) {
            console.warn(`Pulando linha ${i + 1} por falta de dados obrigatórios (name, startDate, groups).`);
            continue;
        }
        
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(rowData.startDate)) {
            console.warn(`Pulando linha ${i + 1} por formato de data inválido para startDate (esperado YYYY-MM-DD).`);
            continue;
        }

        acolhidasData.push({
            name: rowData.name,
            cpf: rowData.cpf || '',
            phone: rowData.phone || '',
            email: rowData.email || '',
            startDate: rowData.startDate,
            endDate: undefined,
            observations: rowData.observations || '',
            groups: rowData.groups.split('|').map(g => g.trim() as Group),
            status: 'ativa',
            attendance: {},
            evaluations: [],
            isOnWaitingList: false,
            isOnWaitingListSocial: false,
        });
    }
    return acolhidasData;
};


export const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = () => {
        if (!file) {
            setError("Por favor, selecione um arquivo.");
            return;
        }
        setIsProcessing(true);
        setError(null);
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csvText = event.target?.result as string;
                const newAcolhidas = parseCSV(csvText);
                onImport(newAcolhidas);
                onClose();
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.onerror = () => {
            setError("Não foi possível ler o arquivo.");
            setIsProcessing(false);
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-efemera-gray rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-efemera-light-gray">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-efemera-pink">Importar Acolhidas via CSV</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-efemera-light-gray rounded-full p-1">
                        <XIcon />
                    </button>
                </div>

                <div className="space-y-4 bg-efemera-dark p-6 rounded-lg border border-efemera-light-gray">
                    <h3 className="font-semibold text-lg text-gray-200">Instruções</h3>
                    <p className="text-sm text-gray-400">
                        Seu arquivo CSV deve conter as seguintes colunas no cabeçalho. A ordem não importa, mas os nomes devem ser exatos e em minúsculas.
                    </p>
                    <div className="text-xs font-mono bg-black p-3 rounded-md text-gray-300">
                        <p><strong className="text-efemera-pink">name</strong> (obrigatório), <strong className="text-efemera-pink">startDate</strong> (obrigatório, formato YYYY-MM-DD), <strong className="text-efemera-pink">groups</strong> (obrigatório), cpf, phone, email, observations</p>
                    </div>
                    <p className="text-sm text-gray-400">
                        Para múltiplos grupos, separe os nomes com uma barra vertical "|". Ex: <code className="bg-black px-1.5 py-0.5 rounded-md text-efemera-pink text-xs">Acolhimento Emergencial|Terapia Individual</code>
                    </p>
                </div>

                <div className="mt-6">
                    <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-300 mb-2">Selecione o arquivo CSV:</label>
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-600 px-6 py-10 bg-efemera-dark">
                        <div className="text-center">
                            <UploadIcon />
                            <div className="mt-4 flex text-sm leading-6 text-gray-400">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md font-semibold text-efemera-pink focus-within:outline-none focus-within:ring-2 focus-within:ring-efemera-pink focus-within:ring-offset-2 focus-within:ring-offset-efemera-gray hover:text-efemera-pink-dark"
                                >
                                    <span>Carregue um arquivo</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />
                                </label>
                                <p className="pl-1">ou arraste e solte</p>
                            </div>
                            <p className="text-xs leading-5 text-gray-500">{file ? file.name : 'CSV até 1MB'}</p>
                        </div>
                    </div>
                </div>

                {error && <p className="mt-4 text-sm text-red-400 bg-red-900/50 p-3 rounded-md border border-red-700">{error}</p>}

                <div className="mt-8 flex justify-end space-x-4">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg bg-efemera-light-gray hover:bg-efemera-gray transition-colors font-semibold">Cancelar</button>
                    <button 
                        type="button" 
                        onClick={handleImport} 
                        disabled={!file || isProcessing}
                        className="px-6 py-2.5 rounded-lg bg-efemera-pink hover:bg-efemera-pink-dark transition-all duration-300 font-semibold shadow-lg shadow-efemera-pink/20 hover:shadow-efemera-pink/40 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processando...' : 'Importar'}
                    </button>
                </div>
            </div>
        </div>
    );
};
