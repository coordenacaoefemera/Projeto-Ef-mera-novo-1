import React, { useMemo, useState } from 'react';
import type { Acolhida, AttendanceRecord, Group } from '../types';
import { CalendarPlusIcon } from './Icons';

interface AttendanceViewProps {
  acolhida: Acolhida;
  onUpdate: (acolhida: Acolhida) => void;
  calendarDate?: Date;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

// --- Componente para Terapia Individual (Calendário) ---
const IndividualTherapyView: React.FC<AttendanceViewProps> = ({ acolhida, onUpdate, calendarDate, onPrevMonth, onNextMonth }) => {
    const currentDate = calendarDate || new Date();
    
    const [schedulingDate, setSchedulingDate] = useState<string | null>(null);
    const [scheduleTime, setScheduleTime] = useState<string>('10:00');

    const handleAttendanceChange = (date: string, newRecord: Partial<AttendanceRecord>) => {
        const currentRecord = acolhida.attendance[date] || {};
        // Fix: Corrected type assertion to Partial<AttendanceRecord> as status is not guaranteed.
        const updatedRecord = { ...currentRecord, ...newRecord } as Partial<AttendanceRecord>;
    
        const newAttendance = { ...acolhida.attendance, [date]: updatedRecord };
        onUpdate({ ...acolhida, attendance: newAttendance });
    };

    const handleConfirmSchedule = () => {
        if (schedulingDate && scheduleTime) {
            handleAttendanceChange(schedulingDate, { time: scheduleTime });
            setSchedulingDate(null);
            setScheduleTime('10:00'); // Reset for next time
        }
    };
    
    const generateGoogleCalendarLink = (date: string, record: AttendanceRecord) => {
        const startTime = new Date(`${date}T${record.time}:00`);
        const endTime = new Date(startTime.getTime() + 50 * 60000); // Assume 50 min session

        const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '');
        
        const event = {
            title: `Sessão de Terapia - ${acolhida.name}`,
            startTime: formatTime(startTime),
            endTime: formatTime(endTime),
            details: `Sessão de terapia com ${acolhida.therapistName || 'terapeuta'}.`,
            guests: [acolhida.email, acolhida.therapistEmail].filter(Boolean).join(','),
        };

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.startTime}/${event.endTime}&details=${encodeURIComponent(event.details)}&add=${encodeURIComponent(event.guests)}`;
    };


    const { daysInMonth, firstDayOfMonth } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const date = new Date(year, month, 1);
        const days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return { daysInMonth: days, firstDayOfMonth: (new Date(year, month, 1)).getDay() };
    }, [currentDate]);

    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="w-full">
            <h4 className="text-md font-semibold text-efemera-pink mb-2">Agenda de Terapia</h4>
            <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={onPrevMonth} className="px-2 py-1 bg-efemera-light-gray rounded">&lt;</button>
                <h3 className="text-xl font-semibold text-efemera-pink capitalize">
                    {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
                <button type="button" onClick={onNextMonth} className="px-2 py-1 bg-efemera-light-gray rounded">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {weekdays.map(day => <div key={day} className="font-bold text-gray-400 text-sm">{day}</div>)}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {daysInMonth.map(day => {
                    const dateString = day.toISOString().split('T')[0];
                    const record = acolhida.attendance[dateString];
                    const isToday = new Date().toISOString().split('T')[0] === dateString;

                    return (
                        <div key={dateString} className={`p-2 border border-efemera-light-gray rounded-md min-h-[140px] flex flex-col ${isToday ? 'bg-efemera-pink-dark' : 'bg-efemera-dark'}`}>
                            <span className="font-bold">{day.getDate()}</span>
                            
                            {record?.time ? (
                                <div className="text-xs mt-1 text-left flex-grow space-y-1">
                                    <div className="flex justify-between items-center">
                                      <p className="font-bold">{record.time}</p>
                                      <a href={generateGoogleCalendarLink(dateString, record as AttendanceRecord)} target="_blank" rel="noopener noreferrer" title="Adicionar ao Google Calendário" className="text-gray-400 hover:text-efemera-pink transition-colors">
                                        <CalendarPlusIcon />
                                      </a>
                                    </div>
                                    <div className="flex gap-1">
                                        <button type="button" onClick={() => handleAttendanceChange(dateString, { status: 'present' })} className={`w-full text-xs py-1 rounded ${record.status === 'present' ? 'bg-green-600' : 'bg-gray-600 hover:bg-green-700'}`}>P</button>
                                        <button type="button" onClick={() => handleAttendanceChange(dateString, { status: 'absent' })} className={`w-full text-xs py-1 rounded ${record.status === 'absent' ? 'bg-red-600' : 'bg-gray-600 hover:bg-red-700'}`}>F</button>
                                    </div>
                                    {record.status && (
                                      <textarea 
                                          placeholder="Evolução..."
                                          value={record.evolution || ''}
                                          onChange={(e) => handleAttendanceChange(dateString, { evolution: e.target.value })}
                                          rows={2}
                                          className="w-full text-xs bg-efemera-light-gray border-gray-600 rounded-md p-1 focus:ring-efemera-pink focus:border-efemera-pink"
                                      />
                                    )}
                                </div>
                            ) : schedulingDate === dateString ? (
                                <div className="text-xs mt-1 text-left flex-grow space-y-1">
                                    <label htmlFor={`time-input-${dateString}`} className="font-bold text-gray-300 text-xs">Horário:</label>
                                    <input
                                        id={`time-input-${dateString}`}
                                        type="time"
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                        className="w-full text-xs bg-efemera-light-gray border-gray-600 rounded-md p-1 focus:ring-efemera-pink focus:border-efemera-pink"
                                    />
                                    <div className="flex gap-1 pt-1">
                                        <button type="button" onClick={() => setSchedulingDate(null)} className="w-full text-xs py-1 rounded bg-gray-600 hover:bg-gray-700">X</button>
                                        <button type="button" onClick={handleConfirmSchedule} className="w-full text-xs py-1 rounded bg-efemera-pink hover:bg-efemera-pink-dark">OK</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-grow flex items-end justify-center">
                                    <button type="button" onClick={() => setSchedulingDate(dateString)} className="text-xs bg-efemera-gray hover:bg-efemera-pink text-white py-1 px-2 rounded-full transition-colors w-full">Agendar</button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};


// --- Componente para Grupos (Lista) ---
const GroupMeetingsView: React.FC<Pick<AttendanceViewProps, 'acolhida' | 'onUpdate'>> = ({ acolhida, onUpdate }) => {
    const groupSchedule: { [key in Group]?: number } = {
        'Acolhimento Emergencial': 2, // Tuesday
        'Florescer Feminino': 3, // Wednesday
        'Círculo de Cura': 4, // Thursday
    };
    const weeklyGroups = acolhida.groups.filter(g => g in groupSchedule);

    const generateScheduledDates = (acolhida: Acolhida): string[] => {
        const scheduledDates = new Set<string>();
        const projectStartDate = new Date('2025-10-01T00:00:00');
        const projectEndDate = new Date('2026-04-30T23:59:59');
        const acolhidaStartDate = new Date(acolhida.startDate + 'T00:00:00');
        const acolhidaEndDate = acolhida.endDate ? new Date(acolhida.endDate + 'T23:59:59') : projectEndDate;
        const effectiveStartDate = new Date(Math.max(projectStartDate.getTime(), acolhidaStartDate.getTime()));
        const effectiveEndDate = new Date(Math.min(projectEndDate.getTime(), acolhidaEndDate.getTime()));
        
        const relevantWeekdays = weeklyGroups.map(g => groupSchedule[g]).filter(d => d !== undefined) as number[];
        if (relevantWeekdays.length === 0) return [];

        let currentDate = new Date(effectiveStartDate);
        if (effectiveStartDate > effectiveEndDate) return [];

        while (currentDate <= effectiveEndDate) {
            if (relevantWeekdays.includes(currentDate.getDay())) {
                scheduledDates.add(currentDate.toISOString().split('T')[0]);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return Array.from(scheduledDates).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
    };

    const scheduledDates = useMemo(() => generateScheduledDates(acolhida), [acolhida]);
    
    const datesByMonth = useMemo(() => {
      return scheduledDates.reduce((acc, date) => {
          const monthYear = new Date(date + 'T00:00:00').toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
          if (!acc[monthYear]) acc[monthYear] = [];
          acc[monthYear].push(date);
          return acc;
      }, {} as Record<string, string[]>);
    }, [scheduledDates]);

    const sortedMonthKeys = useMemo(() => {
      return Object.keys(datesByMonth).sort((a, b) => {
          const firstDateA = datesByMonth[a][0]; 
          const firstDateB = datesByMonth[b][0];
          return new Date(firstDateA).getTime() - new Date(firstDateB).getTime();
      });
    }, [datesByMonth]);

    const handleAttendanceChange = (date: string, newRecord: Partial<AttendanceRecord>) => {
        const currentRecord = acolhida.attendance[date] || {};
        const updatedRecord: Partial<AttendanceRecord> = { ...currentRecord, ...newRecord };
        const newAttendance = { ...acolhida.attendance, [date]: updatedRecord };
        
        let finalAcolhida: Acolhida = { ...acolhida, attendance: newAttendance };

        // Lógica de inativação por 2 faltas (não consecutivas)
        if (newRecord.status === 'absent' && acolhida.status === 'ativa') {
            const totalAbsences = Object.values(newAttendance).filter(
                // Fix: Explicitly type the 'record' parameter in the filter callback to resolve type inference issue with Object.values.
                (record: Partial<AttendanceRecord>) => record.status === 'absent'
            ).length;

            if (totalAbsences >= 2) {
                finalAcolhida.status = 'inativa';
                setTimeout(() => {
                    alert(`${acolhida.name} foi marcada como inativa devido a duas ausências. Você pode reverter o status editando a ficha.`);
                }, 100);
            }
        }

        onUpdate(finalAcolhida);
    };

    if (weeklyGroups.length === 0) {
        return null;
    }

    return (
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        <h4 className="text-md font-semibold text-efemera-pink mt-4">Encontros em Grupo</h4>
        {sortedMonthKeys.map(monthYear => (
              <div key={monthYear}>
                  <h5 className="text-lg font-semibold text-efemera-pink mb-2 capitalize border-b border-efemera-light-gray pb-1">{monthYear}</h5>
                  <div className="space-y-4">
                      {datesByMonth[monthYear].map(date => {
                          const record = acolhida.attendance[date];
                          return (
                              <div key={date} className="bg-efemera-dark p-3 rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                      <p className="font-bold text-gray-200">{new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</p>
                                      <div className="flex space-x-2">
                                          <button type="button" onClick={() => handleAttendanceChange(date, { status: 'present' })} className={`px-3 py-1 text-sm rounded-md transition-colors ${record?.status === 'present' ? 'bg-green-600 text-white' : 'bg-efemera-light-gray hover:bg-green-700'}`}>Presente</button>
                                          <button type="button" onClick={() => handleAttendanceChange(date, { status: 'absent' })} className={`px-3 py-1 text-sm rounded-md transition-colors ${record?.status === 'absent' ? 'bg-red-600 text-white' : 'bg-efemera-light-gray hover:bg-red-700'}`}>Ausente</button>
                                      </div>
                                  </div>
                                  {record?.status && (
                                      <div>
                                          <textarea placeholder="Adicionar observação do dia..." value={record.evolution || ''} onChange={(e) => handleAttendanceChange(date, { evolution: e.target.value })} rows={2} className="w-full mt-1 bg-efemera-light-gray border-gray-600 rounded-md p-2 text-sm focus:ring-efemera-pink focus:border-efemera-pink" />
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </div>
          ))}
      </div>
    );
};

export const AttendanceView: React.FC<AttendanceViewProps> = (props) => {
    const hasTherapyGroup = props.acolhida.groups.some(g => ['Terapia Individual', 'Terapia com valores sociais'].includes(g));
    const hasWeeklyGroup = props.acolhida.groups.some(g => ['Acolhimento Emergencial', 'Florescer Feminino', 'Círculo de Cura'].includes(g));

    return (
        <>
            {hasTherapyGroup && <IndividualTherapyView {...props} />}
            {hasWeeklyGroup && <GroupMeetingsView {...props} />}
            {!hasTherapyGroup && !hasWeeklyGroup && <p className="text-gray-400">Nenhum encontro programado para os grupos selecionados.</p>}
        </>
    );
};