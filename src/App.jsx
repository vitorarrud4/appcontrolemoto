import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, Package, Bike, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from './supabase';
import CadastroMoto from './CadastroMoto';
import EstoqueMotos from './EstoqueMotos';
import Dashboard from './Dashboard';

export default function App() {
  const [telaAtual, setTelaAtual] = useState('dashboard');
  const [motos, setMotos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // Controle de estado do menu
  const [menuAbertoMobile, setMenuAbertoMobile] = useState(false);
  const [menuRecolhidoDesktop, setMenuRecolhidoDesktop] = useState(false);

  const buscarMotos = async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('motos')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setMotos(data || []);
    } catch (err) {
      console.error('Erro ao carregar motos do Supabase:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarMotos();
  }, []);

  const navegarPara = (tela) => {
    buscarMotos();
    setTelaAtual(tela);
    setMenuAbertoMobile(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col md:flex-row">
      {/* CABEÇALHO MOBILE */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-wide text-slate-100">MotoConta</h2>
            <p className="text-[9px] text-slate-400 font-medium">Gestão de Estoque</p>
          </div>
        </div>
        <button
          onClick={() => setMenuAbertoMobile(!menuAbertoMobile)}
          className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
        >
          {menuAbertoMobile ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* OVERLAY MOBILE */}
      {menuAbertoMobile && (
        <div
          onClick={() => setMenuAbertoMobile(false)}
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
        />
      )}

      {/* MENU LATERAL (DESKTOP & MOBILE) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 bg-slate-900 text-white p-4 flex flex-col justify-between shadow-xl transition-all duration-300 ease-in-out ${
          menuAbertoMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${menuRecolhidoDesktop ? 'md:w-20' : 'md:w-64'}`}
      >
        <div>
          {/* Header do Menu com Botão de Colapsar no Desktop */}
          <div className="hidden md:flex items-center justify-between mb-6 px-1 py-2 border-b border-slate-800 pb-4 overflow-hidden">
            {!menuRecolhidoDesktop ? (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/20 shrink-0">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-sm tracking-wide text-slate-100 truncate">MotoConta</h2>
                    <p className="text-[10px] text-slate-400 font-medium truncate">Gestão de Estoque</p>
                  </div>
                </div>

                <button
                  onClick={() => setMenuRecolhidoDesktop(true)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition shrink-0 ml-1"
                  title="Recolher Menu"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setMenuRecolhidoDesktop(false)}
                className="w-full flex justify-center p-2.5 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/20 hover:bg-blue-600/30 transition"
                title="Expandir Menu"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Links de Navegação */}
          <nav className="space-y-2 mt-4 md:mt-0">
            <button
              onClick={() => navegarPara('dashboard')}
              title="Dashboard"
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                telaAtual === 'dashboard'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${menuRecolhidoDesktop ? 'justify-center' : ''}`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              {!menuRecolhidoDesktop && <span className="truncate">Dashboard</span>}
            </button>

            <button
              onClick={() => navegarPara('cadastro')}
              title="Cadastrar Moto"
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                telaAtual === 'cadastro'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${menuRecolhidoDesktop ? 'justify-center' : ''}`}
            >
              <PlusCircle className="w-5 h-5 shrink-0" />
              {!menuRecolhidoDesktop && <span className="truncate">Cadastrar Moto</span>}
            </button>

            <button
              onClick={() => navegarPara('estoque')}
              title={`Ver Estoque (${motos.length})`}
              className={`w-full flex items-center py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                telaAtual === 'estoque'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${menuRecolhidoDesktop ? 'justify-center px-0' : 'justify-between px-3.5'}`}
            >
              <div className={`flex items-center gap-3.5 min-w-0 ${menuRecolhidoDesktop ? 'justify-center w-full relative' : ''}`}>
                <Package className="w-5 h-5 shrink-0" />
                {!menuRecolhidoDesktop && <span className="truncate">Ver Estoque</span>}
                
                {/* Mini badge flutuante alinhada ao lado direito do ícone quando recolhido */}
                {menuRecolhidoDesktop && (
                  <span className="absolute -top-2 -right-3 px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-blue-600 text-white shadow-md border border-slate-900">
                    {carregando ? '...' : motos.length}
                  </span>
                )}
              </div>

              {/* Contador normal quando expandido */}
              {!menuRecolhidoDesktop && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  {carregando ? '...' : motos.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Rodapé do Menu */}
        <div className="px-1 py-3 text-center border-t border-slate-800 space-y-0.5">
          {!menuRecolhidoDesktop ? (
            <>
              <p className="text-[11px] font-medium text-slate-400 truncate">Sistema de Gestão v1.0</p>
              <p className="text-[10px] text-slate-500 truncate">Desenvolvido por Vitor</p>
            </>
          ) : (
            <span className="text-[10px] text-slate-500 font-bold block">v1.0</span>
          )}
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {telaAtual === 'dashboard' && <Dashboard motos={motos} />}
        {telaAtual === 'cadastro' && <CadastroMoto onSalvarSucesso={() => navegarPara('estoque')} />}
        {telaAtual === 'estoque' && <EstoqueMotos motos={motos} onAtualizar={buscarMotos} />}
      </main>
    </div>
  );
}