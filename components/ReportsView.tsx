import React, { useState, useMemo, useRef } from 'react';
import type { Acolhida, Group } from '../types';
import { groupOptions } from '../types';
import { PrinterIcon, SheetIcon } from './Icons';
// @ts-ignore
const { jsPDF } = window.jspdf;
// @ts-ignore
const html2canvas = window.html2canvas;
declare const XLSX: any;


interface ReportsViewProps {
  acolhidas: Acolhida[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ acolhidas }) => {
  const [filters, setFilters] = useState<{
    startDate: string;
    endDate: string;
    status: 'todas' | 'ativa' | 'inativa';
    departureReason: string;
    selectedGroups: Group[];
  }>({
    startDate: '',
    endDate: '',
    status: 'todas',
    departureReason: 'todos',
    selectedGroups: [],
  });
  const [reportData, setReportData] = useState<Acolhida[] | null>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);

  const departureReasons = useMemo(() => {
    const reasons = new Set<string>();
    acolhidas.forEach(a => {
      if (a.departureReason) {
        reasons.add(a.departureReason);
      }
    });
    return Array.from(reasons);
  }, [acolhidas]);
  
  const inputStyles = "w-full bg-efemera-light-gray p-2.5 rounded-lg border-2 border-efemera-light-gray focus:ring-efemera-pink focus:border-efemera-pink transition-colors";
  const labelStyles = "block text-sm font-medium text-gray-300 mb-1";


  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'selectedGroups') {
        const { value: groupValue, checked } = e.target as HTMLInputElement;
        setFilters(prev => {
            const currentGroups = prev.selectedGroups;
            const newGroups = checked
                ? [...currentGroups, groupValue as Group]
                : currentGroups.filter(g => g !== groupValue);
            return { ...prev, selectedGroups: newGroups };
        });
    } else {
        setFilters(prev => ({ ...prev, [name]: value as any }));
    }
  };

  const handleGenerateReport = () => {
    const { startDate, endDate, status, departureReason, selectedGroups } = filters;

    const filtered = acolhidas.filter(acolhida => {
      const acolhidaStartDate = new Date(acolhida.startDate + 'T00:00:00');
      const acolhidaEndDate = acolhida.endDate ? new Date(acolhida.endDate + 'T00:00:00') : null;

      // Filtro de data
      if (startDate && acolhidaStartDate < new Date(startDate)) return false;
      if (endDate && acolhidaStartDate > new Date(endDate)) return false;
      if (startDate && acolhidaEndDate && acolhidaEndDate < new Date(startDate)) return false;

      // Filtro de status
      if (status !== 'todas' && acolhida.status !== status) return false;

      // Filtro de motivo de saída
      if (departureReason !== 'todos' && acolhida.departureReason !== departureReason) return false;
      
      // Filtro de grupo
      if (selectedGroups.length > 0) {
        const hasGroup = acolhida.groups.some(g => selectedGroups.includes(g));
        if (!hasGroup) return false;
      }

      return true;
    });

    setReportData(filtered);
  };

    const handleExportPDF = () => {
        const input = reportContentRef.current;
        if (input) {
            html2canvas(input, {
                scale: 2,
                backgroundColor: '#FFFFFF',
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save(`Relatorio_Efêmera_${new Date().toLocaleDateString()}.pdf`);
            });
        }
    };
    
    const handleExportExcel = () => {
        if (!reportData) {
            alert("Por favor, gere um relatório primeiro.");
            return;
        }

        const dataToExport = reportData.map(a => ({
            'Nome': a.name,
            'CPF': a.cpf,
            'Telefone': a.phone,
            'E-mail': a.email || '-',
            'Grupos': a.groups.join(', '),
            'Status': a.status,
            'Início': new Date(a.startDate + 'T00:00:00').toLocaleDateString(),
            'Fim': a.endDate ? new Date(a.endDate + 'T00:00:00').toLocaleDateString() : '-',
            'Motivo da Saída': a.departureReason || '-',
            'Terapeuta': a.therapistName || '-',
            'Observações Gerais': a.observations,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório de Acolhidas");
        
        const columnWidths = [
            { wch: 30 }, // Nome
            { wch: 15 }, // CPF
            { wch: 15 }, // Telefone
            { wch: 30 }, // E-mail
            { wch: 40 }, // Grupos
            { wch: 10 }, // Status
            { wch: 12 }, // Início
            { wch: 12 }, // Fim
            { wch: 40 }, // Motivo da Saída
            { wch: 30 }, // Terapeuta
            { wch: 50 }, // Observações Gerais
        ];
        worksheet['!cols'] = columnWidths;

        XLSX.writeFile(workbook, `Relatorio_Efêmera_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
    };


  return (
    <div className="bg-efemera-gray p-6 rounded-xl shadow-lg border border-efemera-light-gray">
      <div className="mb-8 border-b-2 border-efemera-light-gray pb-6">
        <h2 className="text-3xl font-bold text-efemera-pink mb-6">Gerador de Relatórios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className={labelStyles}>Data de Início</label>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={inputStyles} />
          </div>
          <div>
            <label className={labelStyles}>Data de Fim</label>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={inputStyles} />
          </div>
          <div>
            <label className={labelStyles}>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className={inputStyles}>
              <option value="todas">Todas</option>
              <option value="ativa">Ativas</option>
              <option value="inativa">Inativas</option>
            </select>
          </div>
          <div>
            <label className={labelStyles}>Motivo da Saída</label>
            <select name="departureReason" value={filters.departureReason} onChange={handleFilterChange} className={inputStyles} disabled={filters.status === 'ativa'}>
              <option value="todos">Todos</option>
              {departureReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-6">
          <label className={labelStyles}>Filtrar por Grupo (opcional)</label>
          <div className="flex flex-wrap gap-x-6 gap-y-3 p-4 bg-efemera-dark rounded-lg mt-2 border border-efemera-light-gray">
            {groupOptions.map(group => (
              <label key={group} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="selectedGroups"
                  value={group}
                  checked={filters.selectedGroups.includes(group)}
                  onChange={handleFilterChange}
                  className="h-4 w-4 rounded border-gray-500 bg-efemera-light-gray text-efemera-pink focus:ring-efemera-pink-dark"
                />
                <span className="text-sm">{group}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-8">
            <button onClick={handleGenerateReport} className="bg-efemera-pink hover:bg-efemera-pink-dark text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl shadow-efemera-pink/30">
                Gerar Relatório
            </button>
        </div>
      </div>

      {reportData && (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-efemera-pink">Resultado do Relatório</h3>
                <div className="flex items-center space-x-3">
                    <button onClick={handleExportPDF} className="flex items-center space-x-2 bg-efemera-light-gray hover:bg-efemera-gray px-4 py-2 rounded-lg transition-colors font-medium">
                        <PrinterIcon />
                        <span>PDF</span>
                    </button>
                    <button onClick={handleExportExcel} className="flex items-center space-x-2 bg-efemera-light-gray hover:bg-efemera-gray px-4 py-2 rounded-lg transition-colors font-medium">
                        <SheetIcon />
                        <span>Excel</span>
                    </button>
                </div>
            </div>
            <div className="bg-efemera-dark p-4 rounded-xl shadow-inner">
                <div ref={reportContentRef} className="bg-white p-8 rounded-md shadow-lg">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-efemera-dark">Relatório de Acolhidas</h1>
                        <p className="text-gray-600">Período de {filters.startDate ? new Date(filters.startDate+'T00:00:00').toLocaleDateString() : 'Início'} a {filters.endDate ? new Date(filters.endDate+'T00:00:00').toLocaleDateString() : 'Fim'}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 mb-8 text-center">
                        <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                            <h4 className="font-bold text-gray-600 text-sm">Total no Período</h4>
                            <p className="text-3xl font-bold text-efemera-dark">{reportData.length}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h4 className="font-bold text-green-700 text-sm">Ativas</h4>
                            <p className="text-3xl font-bold text-green-600">{reportData.filter(a => a.status === 'ativa').length}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <h4 className="font-bold text-red-700 text-sm">Inativas</h4>
                            <p className="text-3xl font-bold text-red-600">{reportData.filter(a => a.status === 'inativa').length}</p>
                        </div>
                    </div>

                    <table className="w-full text-left border-collapse text-gray-800">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="p-3 font-bold text-gray-700">Nome</th>
                                <th className="p-3 font-bold text-gray-700">Telefone</th>
                                <th className="p-3 font-bold text-gray-700">Grupos</th>
                                <th className="p-3 font-bold text-gray-700">Início</th>
                                <th className="p-3 font-bold text-gray-700">Fim</th>
                                <th className="p-3 font-bold text-gray-700">Motivo da Saída</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map(acolhida => (
                                <tr key={acolhida.id} className="hover:bg-gray-50 border-b border-gray-200">
                                    <td className="p-3 font-medium">{acolhida.name}</td>
                                    <td className="p-3 text-gray-600">{acolhida.phone}</td>
                                    <td className="p-3 text-gray-600 text-sm">{acolhida.groups.join(', ')}</td>
                                    <td className="p-3 text-gray-600">{new Date(acolhida.startDate+'T00:00:00').toLocaleDateString()}</td>
                                    <td className="p-3 text-gray-600">{acolhida.endDate ? new Date(acolhida.endDate+'T00:00:00').toLocaleDateString() : '-'}</td>
                                    <td className="p-3 text-sm text-gray-500">{acolhida.departureReason || '-'}</td>
                                </tr>
                            ))}
                             {reportData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center p-6 text-gray-500">Nenhum dado encontrado para os filtros selecionados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};