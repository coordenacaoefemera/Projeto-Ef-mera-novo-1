// Fix: Create the AcolhidaDetailModal component to display details of an acolhida.
import React from 'react';
import type { Acolhida } from '../types';
import { XIcon, EditIcon, UsersIcon, CalendarCheckIcon, AlertTriangleIcon, ClockIcon } from './Icons';

interface AcolhidaDetailModalProps {
  acolhida: Acolhida;
  onClose: () => void;
  onEdit: () => void;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode, icon?: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="bg-efemera-dark p-4 rounded-lg border border-efemera-light-gray">
        <h4 className="font-semibold text-efemera-pink mb-2 flex items-center">
            {icon && <span className="mr-2">{icon}</span>}
            {title}
        </h4>
        <div className="text-gray-300 space-y-1">{children}</div>
    </div>
);


export const AcolhidaDetailModal: React.FC<AcolhidaDetailModalProps> = ({ acolhida, onClose, onEdit }) => {
  const isTherapyGroup = acolhida.groups.some(g => ['Terapia Individual', 'Terapia com valores sociais'].includes(g));
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-efemera-gray rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-3xl max-h-[95vh] overflow-y-auto border border-efemera-light-gray">
        <div className="flex justify-between items-start mb-6 border-b-2 border-efemera-light-gray pb-4">
          <div>
            <h2 className="text-3xl font-bold text-efemera-pink">{acolhida.name}</h2>
            <p className="text-gray-400 mt-1">{acolhida.email || 'E-mail não informado'}</p>
            <p className="text-gray-400 text-sm">{acolhida.cpf} &bull; {acolhida.phone}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={onEdit} className="flex items-center space-x-2 px-4 py-2 text-sm rounded-lg bg-efemera-light-gray hover:bg-efemera-gray transition-colors"><EditIcon /> <span>Editar</span></button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-efemera-light-gray rounded-full p-1">
              <XIcon />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="Status">
               <p className={`flex items-center font-semibold ${acolhida.status === 'ativa' ? 'text-green-400' : 'text-red-400'}`}>
                {acolhida.status === 'ativa' ? <CalendarCheckIcon /> : <AlertTriangleIcon />}
                <span className="ml-2 capitalize">{acolhida.status}</span>
              </p>
            </InfoCard>

            <InfoCard title="Grupos" icon={<UsersIcon/>}>
              <div className="flex flex-wrap gap-2">
                {acolhida.groups.map(group => (
                    <span key={group} className="bg-efemera-pink/20 text-efemera-pink px-3 py-1 text-sm rounded-full font-medium border border-efemera-pink/30">{group}</span>
                ))}
              </div>
            </InfoCard>
          </div>
          
           <InfoCard title="Período de Acolhimento">
              <p><strong>Início:</strong> {new Date(acolhida.startDate + 'T00:00:00').toLocaleDateString()}</p>
              {acolhida.endDate && <p><strong>Fim:</strong> {new Date(acolhida.endDate + 'T00:00:00').toLocaleDateString()}</p>}
              {acolhida.departureReason && (
                  <div className="mt-3 pt-3 border-t border-efemera-light-gray">
                      <p className="font-semibold text-gray-300">Motivo da Finalização:</p>
                      <p className="whitespace-pre-wrap text-gray-300 mt-1 text-sm">{acolhida.departureReason}</p>
                  </div>
              )}
          </InfoCard>

          {(acolhida.isOnWaitingList || acolhida.isOnWaitingListSocial) && (
            <div className="bg-yellow-900/50 text-yellow-300 p-3 rounded-lg flex items-center text-sm border border-yellow-700">
                <ClockIcon />
                <span className="ml-3 font-medium">Esta acolhida está na fila de espera para Terapia.</span>
            </div>
          )}
          
          {isTherapyGroup && (
             <InfoCard title="Informações do Terapeuta">
                <p><strong>Nome:</strong> {acolhida.therapistName || 'Não informado'}</p>
                <p><strong>Telefone:</strong> {acolhida.therapistPhone || 'Não informado'}</p>
                <p><strong>E-mail:</strong> {acolhida.therapistEmail || 'Não informado'}</p>
             </InfoCard>
          )}
          
          <InfoCard title="Observações Gerais">
            <p className="whitespace-pre-wrap text-gray-300 text-sm">{acolhida.observations || 'Nenhuma observação.'}</p>
          </InfoCard>

          <InfoCard title="Controle de Presença e Evolução">
            <div className="text-center text-gray-400 p-4 bg-efemera-dark rounded-md border border-efemera-light-gray">
                <p className="font-medium">O registro de presença e evolução é feito na tela de edição.</p>
                <p className="text-sm mt-1">Clique em "Editar" para gerenciar a agenda.</p>
            </div>
          </InfoCard>
          
          <InfoCard title="Avaliações">
            {acolhida.evaluations.length > 0 ? (
                <ul className="space-y-2">
                    {acolhida.evaluations.map(ev => (
                        <li key={ev.id} className="border-t border-efemera-light-gray pt-2">
                            <p className="font-semibold">{new Date(ev.date).toLocaleDateString()}</p>
                            <p className="text-gray-300 text-sm">{ev.notes}</p>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-gray-400 text-sm">Nenhuma avaliação registrada.</p>}
          </InfoCard>

        </div>
      </div>
    </div>
  );
};