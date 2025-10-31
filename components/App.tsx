import React, { useState, useEffect, useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { SupabaseConfigScreen } from './SupabaseConfigScreen';
import { Auth } from './Auth';
import type { Acolhida, Group } from '../types';
import { AcolhidaForm } from './AcolhidaForm';
import { AcolhidaDetailModal } from './AcolhidaDetailModal';
import { ReportsView } from './ReportsView';
import { ImportModal } from './ImportModal';
import { groupOptions } from '../types';

const App: React.FC = () => {
  const [configured, setConfigured] = useState(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [acolhidas, setAcolhidas] = useState<Acolhida[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // App State
  const [activeTab, setActiveTab] = useState<'acolhidas' | 'reports'>('acolhidas');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'ativa' | 'inativa'>('todas');
  const [groupFilter, setGroupFilter] = useState<Group | 'todas'>('todas');
  const [waitingListFilter, setWaitingListFilter] = useState<boolean>(false);


  // Modal State
  const [selectedAcolhida, setSelectedAcolhida] = useState<Acolhida | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleConfigured = () => {
    // Force a reload to re-initialize supabaseClient
    window.location.reload();
  };

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      setInitialLoading(false);
      return;
    }

    supabaseClient!.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabaseClient!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [configured]);
  
  const sanitizeAcolhida = (item: any): Acolhida => {
    return {
      ...item,
      // Ensure required/complex fields have default values to prevent crashes
      name: item.name || 'Nome Inválido',
      groups: Array.isArray(item.groups) ? item.groups : [],
      attendance: item.attendance || {},
      evaluations: Array.isArray(item.evaluations) ? item.evaluations : [],
      // Coalesce other potentially null fields that are used in rendering
      cpf: item.cpf || '',
      phone: item.phone || '',
      email: item.email || '',
      therapistName: item.therapistName || '',
    };
  };
  
  const fetchAcolhidas = async () => {
    if (!supabaseClient) return;
    setInitialLoading(true);
    try {
      const { data, error } = await supabaseClient.from('acolhidas').select('*');
      if (error) throw error;
      
      const sanitizedData = (data || []).map(sanitizeAcolhida);
      setAcolhidas(sanitizedData);
    } catch (error: any) {
      console.error('Error fetching acolhidas:', error);
      if (error.code === '42P01') {
        alert("Erro de Conexão: A tabela 'acolhidas' não foi encontrada no banco de dados. Por favor, verifique se você executou o script SQL no Editor de SQL do seu painel Supabase, conforme o passo a passo de configuração.");
      } else {
        alert('Não foi possível carregar os dados. Verifique sua conexão e a configuração do Supabase.');
      }
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAcolhidas();
    }
  }, [session]);
  
  const handleSave = async (acolhidaToSave: Partial<Acolhida>) => {
    if (!supabaseClient) return;

    const isNew = !acolhidaToSave.id;

    try {
        let savedAcolhidaData: Acolhida | null = null;

        if (isNew) {
            // The `id` property is not present for new records, so we can insert directly.
            const { data, error } = await supabaseClient
                .from('acolhidas')
                .insert(acolhidaToSave)
                .select()
                .single();

            if (error) throw error;
            savedAcolhidaData = data;

        } else {
            // It's an update, id is present.
            const { data, error } = await supabaseClient
                .from('acolhidas')
                .update(acolhidaToSave)
                .eq('id', acolhidaToSave.id!) // Use non-null assertion as we've checked
                .select()
                .single();

            if (error) throw error;
            savedAcolhidaData = data;
        }

        if (savedAcolhidaData) {
            const savedAcolhida = sanitizeAcolhida(savedAcolhidaData);
            setAcolhidas(prev => {
                const index = prev.findIndex(a => a.id === savedAcolhida.id);
                if (index > -1) {
                    const newAcolhidas = [...prev];
                    newAcolhidas[index] = savedAcolhida;
                    return newAcolhidas;
                }
                return [...prev, savedAcolhida];
            });
        }
        setIsFormOpen(false);
        setSelectedAcolhida(null);
    } catch (error) {
        console.error("Error saving acolhida:", error);
        alert('Falha ao salvar. Tente novamente.');
    }
  };


  const handleImport = async (newAcolhidas: Omit<Acolhida, 'id'>[]) => {
      if (!supabaseClient) return;
      const acolhidasToInsert = newAcolhidas.map(a => ({
          ...a,
          id: undefined, // ensure id is not set for inserts
      }));
      
      try {
        const { data, error } = await supabaseClient.from('acolhidas').insert(acolhidasToInsert as any).select();
        if (error) throw error;

        if (data) {
            const sanitizedData = data.map(sanitizeAcolhida);
            setAcolhidas(prev => [...prev, ...sanitizedData]);
            alert(`${data.length} acolhidas importadas com sucesso!`);
        }
        setIsImportOpen(false);
      } catch (error) {
          console.error("Error importing acolhidas:", error);
          alert('Falha ao importar. Verifique o console para mais detalhes.');
      }
  };

  const openForm = (acolhida: Acolhida | null) => {
    setSelectedAcolhida(acolhida);
    setIsFormOpen(true);
  };
  
  const openDetail = (acolhida: Acolhida) => {
    setSelectedAcolhida(acolhida);
    setIsDetailOpen(true);
  };

  const filteredAcolhidas = useMemo(() => {
    return acolhidas
      .filter(a => {
        if (!a) return false; // Safety check
        if (statusFilter === 'todas') return true;
        return a.status === statusFilter;
      })
      .filter(a => {
        if (groupFilter === 'todas') return true;
        return a.groups.includes(groupFilter);
      })
      .filter(a => {
          if (!waitingListFilter) return true;
          return a.isOnWaitingList || a.isOnWaitingListSocial;
      })
      .filter(a => {
        const search = searchTerm.toLowerCase();
        return (
          a.name.toLowerCase().includes(search) ||
          (a.cpf || '').toLowerCase().includes(search) ||
          (a.email || '').toLowerCase().includes(search) ||
          (a.therapistName || '').toLowerCase().includes(search)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [acolhidas, searchTerm, statusFilter, groupFilter, waitingListFilter]);

  if (loading) {
    return <div className="bg-efemera-dark min-h-screen flex items-center justify-center text-white">Carregando...</div>;
  }
  if (!configured) {
    return <SupabaseConfigScreen onConfigured={handleConfigured} />;
  }
  if (!session) {
    return <Auth />;
  }

  return (
    <div className="bg-efemera-dark min-h-screen text-white p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-efemera-pink">EFÊMERA</h1>
        <button onClick={() => supabaseClient?.auth.signOut()} className="bg-efemera-light-gray px-4 py-2 rounded-lg hover:bg-efemera-gray transition-colors">
          Sair
        </button>
      </header>

      <div className="flex border-b border-efemera-light-gray mb-6">
        <button onClick={() => setActiveTab('acolhidas')} className={`px-4 py-2 text-lg font-medium ${activeTab === 'acolhidas' ? 'text-efemera-pink border-b-2 border-efemera-pink' : 'text-gray-400'}`}>
          Acolhidas
        </button>
        <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 text-lg font-medium ${activeTab === 'reports' ? 'text-efemera-pink border-b-2 border-efemera-pink' : 'text-gray-400'}`}>
          Relatórios
        </button>
      </div>
      
      {initialLoading ? (
        <div className="text-center p-10 text-xl font-semibold text-gray-300">Carregando dados do banco de dados...</div>
      ) : activeTab === 'acolhidas' ? (
        <>
          <div className="bg-efemera-gray p-4 rounded-xl mb-6 border border-efemera-light-gray">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <input type="text" placeholder="Buscar por nome, CPF, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-efemera-light-gray p-2.5 rounded-lg border-2 border-efemera-light-gray focus:ring-efemera-pink focus:border-efemera-pink transition-colors" />
              
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full bg-efemera-light-gray p-2.5 rounded-lg border-2 border-efemera-light-gray focus:ring-efemera-pink focus:border-efemera-pink transition-colors">
                <option value="todas">Todos os Status</option>
                <option value="ativa">Ativas</option>
                <option value="inativa">Inativas</option>
              </select>

              <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value as any)} className="w-full bg-efemera-light-gray p-2.5 rounded-lg border-2 border-efemera-light-gray focus:ring-efemera-pink focus:border-efemera-pink transition-colors">
                <option value="todas">Todos os Grupos</option>
                {groupOptions.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              
               <label className="flex items-center space-x-2 cursor-pointer justify-self-start md:justify-self-end">
                  <input type="checkbox" checked={waitingListFilter} onChange={(e) => setWaitingListFilter(e.target.checked)} className="h-5 w-5 rounded border-gray-500 bg-efemera-dark text-efemera-pink focus:ring-efemera-pink-dark" />
                  <span>Apenas Fila de Espera</span>
              </label>

            </div>
             <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button onClick={() => openForm(null)} className="bg-efemera-pink hover:bg-efemera-pink-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                + Nova Acolhida
              </button>
              <button onClick={() => setIsImportOpen(true)} className="bg-efemera-light-gray hover:bg-efemera-gray text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Importar CSV
              </button>
            </div>
          </div>
          
          {filteredAcolhidas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAcolhidas.map(acolhida => (
                <div key={acolhida.id} className="bg-efemera-gray p-4 rounded-xl border border-efemera-light-gray flex flex-col justify-between hover:border-efemera-pink transition-colors">
                  <div>
                    <h3 className="font-bold text-lg truncate" title={acolhida.name}>{acolhida.name}</h3>
                    <p className={`text-sm font-semibold ${acolhida.status === 'ativa' ? 'text-green-400' : 'text-red-400'}`}>
                      {acolhida.status === 'ativa' ? 'Ativa' : 'Inativa'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                       {acolhida.groups.slice(0, 2).map(g => <span key={g} className="text-xs bg-efemera-pink/20 text-efemera-pink px-2 py-0.5 rounded-full">{g}</span>)}
                       {acolhida.groups.length > 2 && <span className="text-xs bg-efemera-pink/20 text-efemera-pink px-2 py-0.5 rounded-full">+{acolhida.groups.length - 2}</span>}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={() => openDetail(acolhida)} className="text-gray-300 hover:text-white transition-colors">Ver Detalhes</button>
                    <button onClick={() => openForm(acolhida)} className="bg-efemera-light-gray px-3 py-1 rounded-md hover:bg-efemera-pink transition-colors text-sm">Editar</button>
                  </div>
                </div>
              ))}
            </div>
           ) : (
             <div className="text-center p-10 bg-efemera-gray rounded-xl border border-efemera-light-gray">
              <h3 className="text-xl font-semibold text-white">Nenhuma Acolhida Encontrada</h3>
              <p className="text-gray-400 mt-2">
                Sua conexão com o banco de dados parece estar funcionando!
                <br />
                {searchTerm || statusFilter !== 'todas' || groupFilter !== 'todas' || waitingListFilter
                  ? "Tente ajustar seus filtros ou cadastre uma nova acolhida."
                  : "Clique em '+ Nova Acolhida' para adicionar o primeiro registro."}
              </p>
            </div>
          )}
        </>
      ) : <ReportsView acolhidas={acolhidas} />}
      
      {isFormOpen && <AcolhidaForm acolhida={selectedAcolhida} onSave={handleSave} onClose={() => { setIsFormOpen(false); setSelectedAcolhida(null); }} />}
      {isDetailOpen && selectedAcolhida && <AcolhidaDetailModal acolhida={selectedAcolhida} onEdit={() => { setIsDetailOpen(false); openForm(selectedAcolhida); }} onClose={() => { setIsDetailOpen(false); setSelectedAcolhida(null); }} />}
      {isImportOpen && <ImportModal onClose={() => setIsImportOpen(false)} onImport={handleImport} />}

    </div>
  );
};

export default App;