import React, { useState } from 'react';
import type { Acolhida, Group } from '../types';
import { groupOptions } from '../types';
import { XIcon } from './Icons';
import { AttendanceView } from './AttendanceView';

interface AcolhidaFormProps {
  acolhida: Acolhida | null;
  onSave: (acolhida: Partial<Acolhida>) => void;
  onClose: () => void;
}

const getNewAcolhidaTemplate = (): Omit<Acolhida, 'id'> => ({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    observations: '',
    groups: ['Acolhimento Emergencial'],
    status: 'ativa',
    therapistName: '',
    therapistPhone: '',
    therapistEmail: '',
    departureReason: '',
    attendance: {},
    evaluations: [],
    isOnWaitingList: false,
    isOnWaitingListSocial: false,
});

const getInitialCalendarDate = () => {
    const today = new Date();
    const projectStart = new Date('2025-10-01');
    const projectEnd = new Date('2026-04-30');
    
    const todayMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const projectMonthStart = new Date(projectStart.getFullYear(), projectStart.getMonth(), 1);
    const projectMonthEnd = new Date(projectEnd.getFullYear(), projectEnd.getMonth(), 1);

    if (todayMonthStart < projectMonthStart) {
        return projectMonthStart;
    }
    if (todayMonthStart > projectMonthEnd) {
        return projectMonthEnd;
    }
    return todayMonthStart;
};


export const AcolhidaForm: React.FC<AcolhidaFormProps> = ({ acolhida, onSave, onClose }) => {
  const [editableAcolhida, setEditableAcolhida] = useState(() => 
    acolhida ? { ...acolhida } : getNewAcolhidaTemplate()
  );
  const [calendarDate, setCalendarDate] = useState(getInitialCalendarDate());

  const handleNextMonth = () => {
    setCalendarDate(current => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };
  const handlePrevMonth = () => {
    setCalendarDate(current => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'groups') {
        const { value: groupValue, checked } = e.target as HTMLInputElement;
        setEditableAcolhida(prev => {
            const currentGroups = prev.groups || [];
            const newGroups = checked 
                ? [...currentGroups, groupValue as Group]
                : currentGroups.filter(g => g !== groupValue);

            // Auto-uncheck waiting list when promoted
            let newWaitingList = prev.isOnWaitingList;
            if (checked && groupValue === 'Terapia Individual') {
                newWaitingList = false;
            }

            let newWaitingListSocial = prev.isOnWaitingListSocial;
            if (checked && groupValue === 'Terapia com valores sociais') {
                newWaitingListSocial = false;
            }
            
            return { ...prev, groups: newGroups, isOnWaitingList: newWaitingList, isOnWaitingListSocial: newWaitingListSocial };
        });
    } else if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setEditableAcolhida(prev => ({ ...prev, [name]: checked }));
    } else {
        setEditableAcolhida(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleAttendanceUpdate = (updatedAcolhida: Acolhida) => {
    setEditableAcolhida(updatedAcolhida);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isTherapyGroup = editableAcolhida.groups.some(g => ['Terapia Individual', 'Terapia com valores sociais'].includes(g));
    
    if (editableAcolhida.groups.length === 0) {
        alert("Por favor, selecione ao menos um grupo para a acolhida.");
        return;
    }
    
    const finalAcolhidaData: Partial<Acolhida> = {
      ...editableAcolhida,
      endDate: editableAcolhida.endDate || undefined,
      therapistName: isTherapyGroup ? editableAcolhida.therapistName : undefined,
      therapistPhone: isTherapyGroup ? editableAcolhida.therapistPhone : undefined,
      therapistEmail: isTherapyGroup ? editableAcolhida.therapistEmail : undefined,
      departureReason: editableAcolhida.status === 'inativa' ? editableAcolhida.departureReason : undefined,
    };
    
    if (acolhida) {
      finalAcolhidaData.id = acolhida.id;
    }

    onSave(finalAcolhidaData);
  };
  
  const isWaitingListApplicable = editableAcolhida.groups.some(g => ['Acolhimento Emergencial', 'Florescer Feminino', 'Círculo de Cura'].includes(g));
  const isTherapyGroup = editableAcolhida.groups.some(g => ['Terapia Individual', 'Terapia com valores sociais'].includes(g));

  const inputStyles = "w-full mt-1 bg-efemera-light-gray border-2 border-efemera-light-gray rounded-lg p-2.5 focus:ring-efemera-pink focus:border-efemera-pink transition-colors";
  const labelStyles = "block text-sm font-medium text-gray-300";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-efemera-gray rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto border border-efemera-light-gray">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-efemera-pink">{acolhida ? 'Editar' : 'Nova'} Acolhida</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-efemera-light-gray rounded-full p-1">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Cadastrais */}
          <div className="p-4 bg-efemera-dark rounded-lg border border-efemera-light-gray">
            <h3 className="text-lg font-semibold text-efemera-pink mb-4">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className={labelStyles}>Nome da Paciente</label>
                <input type="text" name="name" value={editableAcolhida.name} onChange={handleChange} className={inputStyles} required />
              </div>
               <div>
                <label htmlFor="email" className={labelStyles}>E-mail da Paciente</label>
                <input type="email" name="email" value={editableAcolhida.email || ''} onChange={handleChange} className={inputStyles} />
              </div>
              <div>
                <label htmlFor="cpf" className={labelStyles}>CPF</label>
                <input type="text" name="cpf" value={editableAcolhida.cpf} onChange={handleChange} className={inputStyles} />
              </div>
              <div>
                <label htmlFor="phone" className={labelStyles}>Telefone da Paciente</label>
                <input type="text" name="phone" value={editableAcolhida.phone} onChange={handleChange} className={inputStyles} required/>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-efemera-dark rounded-lg border border-efemera-light-gray">
            <h3 className="text-lg font-semibold text-efemera-pink mb-4">Detalhes do Acolhimento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label htmlFor="startDate" className={labelStyles}>Início</label>
                <input type="date" name="startDate" value={editableAcolhida.startDate} onChange={handleChange} className={inputStyles} required />
              </div>
              <div>
                <label htmlFor="endDate" className={labelStyles}>Finalização (Opcional)</label>
                <input type="date" name="endDate" value={editableAcolhida.endDate || ''} onChange={handleChange} className={inputStyles} />
              </div>
               <div>
                <label htmlFor="status" className={labelStyles}>Status</label>
                <select name="status" value={editableAcolhida.status} onChange={handleChange} className={inputStyles}>
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                </select>
              </div>
              {editableAcolhida.status === 'inativa' && (
               <div className="md:col-span-2">
                  <label htmlFor="departureReason" className={labelStyles}>Motivo da Finalização</label>
                  <textarea name="departureReason" value={editableAcolhida.departureReason || ''} onChange={handleChange} rows={3} className={inputStyles}></textarea>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-efemera-dark rounded-lg border border-efemera-light-gray">
            <h3 className="text-lg font-semibold text-efemera-pink mb-4">Participação em Grupos</h3>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groupOptions.map(group => (
                <label key={group} className="flex items-center space-x-3 cursor-pointer p-3 bg-efemera-light-gray rounded-lg hover:bg-efemera-gray transition-colors">
                  <input type="checkbox" name="groups" value={group} checked={editableAcolhida.groups.includes(group)} onChange={handleChange} className="h-5 w-5 border-gray-500 bg-efemera-dark text-efemera-pink focus:ring-efemera-pink-dark rounded" />
                  <span>{group}</span>
                </label>
              ))}
            </div>
          </div>

          {isTherapyGroup && (
            <div className="p-4 bg-efemera-dark rounded-lg border border-efemera-light-gray">
              <h3 className="text-lg font-semibold text-efemera-pink mb-4">Informações do Terapeuta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                  <label htmlFor="therapistName" className={labelStyles}>Nome</label>
                  <input type="text" name="therapistName" value={editableAcolhida.therapistName || ''} onChange={handleChange} className={inputStyles} />
                </div>
                <div>
                  <label htmlFor="therapistPhone" className={labelStyles}>Telefone</label>
                  <input type="text" name="therapistPhone" value={editableAcolhida.therapistPhone || ''} onChange={handleChange} className={inputStyles} />
                </div>
                 <div className="md:col-span-2">
                  <label htmlFor="therapistEmail" className={labelStyles}>E-mail</label>
                  <input type="email" name="therapistEmail" value={editableAcolhida.therapistEmail || ''} onChange={handleChange} className={inputStyles} />
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-efemera-dark rounded-lg border border-efemera-light-gray">
            <h3 className="text-lg font-semibold text-efemera-pink mb-4">Observações e Encaminhamento</h3>
            <textarea name="observations" placeholder="Adicione observações gerais sobre a acolhida..." value={editableAcolhida.observations} onChange={handleChange} rows={4} className={inputStyles}></textarea>
            {isWaitingListApplicable && (
             <div className="space-y-3 mt-4 p-3 bg-efemera-gray rounded-md border border-efemera-light-gray">
                <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                        type="checkbox"
                        id="isOnWaitingList"
                        name="isOnWaitingList"
                        checked={!!editableAcolhida.isOnWaitingList}
                        onChange={handleChange}
                        className="h-5 w-5 rounded border-gray-500 bg-efemera-dark text-efemera-pink focus:ring-efemera-pink-dark"
                    />
                    <span className="text-sm text-gray-200">Encaminhar para fila de Terapia Individual</span>
                </label>
                 <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                        type="checkbox"
                        id="isOnWaitingListSocial"
                        name="isOnWaitingListSocial"
                        checked={!!editableAcolhida.isOnWaitingListSocial}
                        onChange={handleChange}
                        className="h-5 w-5 rounded border-gray-500 bg-efemera-dark text-efemera-pink focus:ring-efemera-pink-dark"
                    />
                    <span className="text-sm text-gray-200">Encaminhar para fila de Terapia com valores sociais</span>
                </label>
            </div>
          )}
          </div>
          
          {acolhida && (
            <div className="mt-6 border-t-2 border-efemera-light-gray pt-6">
                <AttendanceView
                    acolhida={editableAcolhida as Acolhida}
                    onUpdate={handleAttendanceUpdate}
                    calendarDate={calendarDate}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                />
            </div>
          )}

          <div className="flex justify-end pt-4 space-x-4">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg bg-efemera-light-gray hover:bg-efemera-gray transition-colors font-semibold">Cancelar</button>
            <button type="submit" className="px-6 py-2.5 rounded-lg bg-efemera-pink hover:bg-efemera-pink-dark transition-all duration-300 font-semibold shadow-lg shadow-efemera-pink/20 hover:shadow-efemera-pink/40">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
};