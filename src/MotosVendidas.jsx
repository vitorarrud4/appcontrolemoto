import React, { useState } from 'react';
import { Search, Trash2, Pencil, Check, X, RefreshCw, CheckCircle2, RefreshCcw, Plus, DollarSign } from 'lucide-react';
import { supabase } from './supabase';

export default function MotosVendidas({ motos = [], onAtualizar }) {
  const [termoBusca, setTermoBusca] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEdicao, setDadosEdicao] = useState({});
  const [salvando, setSalvando] = useState(false);

  // Filtragem de motos vendidas
  const motosFiltradas = motos.filter((moto) => {
    const termo = termoBusca.toLowerCase();
    return (
      moto.modelo?.toLowerCase().includes(termo) ||
      moto.marca?.toLowerCase().includes(termo) ||
      moto.placa?.toLowerCase().includes(termo)
    );
  });

  // Excluir Venda
  const handleExcluir = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de venda?')) return;

    try {
      const { error } = await supabase.from('motos').delete().eq('id', id);
      if (error) throw error;
      if (onAtualizar) onAtualizar();
    } catch (err) {
      console.error('Erro ao excluir venda:', err);
      alert('Erro ao excluir do banco de dados.');
    }
  };

  // Iniciar Edição (carregando preço de compra, venda e custos adicionais)
  const handleIniciarEdicao = (moto) => {
    setEditandoId(moto.id);
    setDadosEdicao({
      placa: moto.placa || '',
      cor: moto.cor || '',
      preco_compra: moto.preco_compra || 0,
      preco_venda: moto.preco_venda || 0,
      custos_adicionais: moto.custos_adicionais || []
    });
  };

  const handleCancelarEdicao = () => {
    setEditandoId(null);
    setDadosEdicao({});
  };

  // Gerenciamento de custos adicionais na edição
  const handleAdicionarCustoEdicao = () => {
    const custosAtuais = dadosEdicao.custos_adicionais || [];
    setDadosEdicao({
      ...dadosEdicao,
      custos_adicionais: [...custosAtuais, { descricao: '', valor: '' }]
    });
  };

  const handleRemoverCustoEdicao = (index) => {
    const custosAtuais = [...dadosEdicao.custos_adicionais];
    custosAtuais.splice(index, 1);
    setDadosEdicao({ ...dadosEdicao, custos_adicionais: custosAtuais });
  };

  const handleAtualizarCustoEdicao = (index, campo, valor) => {
    const custosAtuais = [...dadosEdicao.custos_adicionais];
    custosAtuais[index][campo] = valor;
    setDadosEdicao({ ...dadosEdicao, custos_adicionais: custosAtuais });
  };

  // Salvar Edição no Supabase
  const handleSalvarEdicao = async (id) => {
    setSalvando(true);
    const valorCompra = parseFloat(dadosEdicao.preco_compra) || 0;
    const valorVenda = parseFloat(dadosEdicao.preco_venda) || 0;

    const totalCustosAdicionais = (dadosEdicao.custos_adicionais || []).reduce(
      (acc, c) => acc + (parseFloat(c.valor) || 0),
      0
    );

    const custoTotalCalculado = valorCompra + totalCustosAdicionais;
    const lucroRealCalculado = valorVenda - custoTotalCalculado;

    const atualizacao = {
      placa: dadosEdicao.placa,
      cor: dadosEdicao.cor,
      preco_compra: valorCompra,
      preco_venda: valorVenda,
      custos_adicionais: dadosEdicao.custos_adicionais,
      custo_total: custoTotalCalculado,
      lucro_real: lucroRealCalculado
    };

    try {
      const { error } = await supabase.from('motos').update(atualizacao).eq('id', id);
      if (error) throw error;
      setEditandoId(null);
      if (onAtualizar) onAtualizar();
    } catch (err) {
      console.error('Erro ao atualizar venda:', err);
      alert('Erro ao salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 font-sans text-slate-800">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          <h1 className="text-xl font-bold text-slate-900">Motos Vendidas</h1>
        </div>
        <button
          onClick={onAtualizar}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 transition text-slate-600 cursor-pointer"
          title="Atualizar lista"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Campo de Busca */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Buscar por modelo, marca ou placa..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
        />
      </div>

      {/* Lista de Cards */}
      <div className="space-y-4">
        {motosFiltradas.length > 0 ? (
          motosFiltradas.map((moto) => {
            const estaEditando = editandoId === moto.id;

            // Cálculos em tempo de edição
            const totalAdicionaisEdicao = (dadosEdicao.custos_adicionais || []).reduce(
              (acc, c) => acc + (parseFloat(c.valor) || 0),
              0
            );
            const custoEditado = (parseFloat(dadosEdicao.preco_compra) || 0) + totalAdicionaisEdicao;
            const lucroEditado = (parseFloat(dadosEdicao.preco_venda) || 0) - custoEditado;

            return (
              <div key={moto.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start">
                  <div>
                    {moto.marca && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {moto.marca}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-slate-900 mt-1">{moto.modelo}</h3>
                  </div>

                  {/* Ações (Editar e Excluir) */}
                  <div className="flex items-center gap-1">
                    {!estaEditando ? (
                      <>
                        <span className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold mr-1">
                          Vendida
                        </span>
                        <button
                          onClick={() => handleIniciarEdicao(moto)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExcluir(moto.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSalvarEdicao(moto.id)}
                          disabled={salvando}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Salvar"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleCancelarEdicao}
                          disabled={salvando}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Cancelar"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Dados da Venda (Modo Visualização) */}
                {!estaEditando ? (
                  <>
                    <p className="text-xs text-slate-500">
                      Ano: <span className="font-medium text-slate-700">{moto.ano || 'N/A'}</span> | Placa:{' '}
                      <span className="font-semibold text-slate-800">{moto.placa || 'N/A'}</span> | Cor:{' '}
                      <span className="font-medium text-slate-700">{moto.cor || 'N/A'}</span>
                    </p>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Custo Total (Compra + Gastos)</span>
                        <span className="font-semibold text-slate-700">
                          R$ {(moto.custo_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Preço de Venda</span>
                        <span className="font-semibold text-slate-700">
                          R$ {(moto.preco_venda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Exibir Gastos Adicionais salvos */}
                    {moto.custos_adicionais && moto.custos_adicionais.length > 0 && (
                      <div className="text-xs text-slate-500 bg-slate-50/50 p-2 rounded-lg space-y-1">
                        <span className="font-semibold text-[10px] text-slate-400 uppercase block">Gastos Adicionais:</span>
                        {moto.custos_adicionais.map((c, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{c.descricao || 'Gasto'}</span>
                            <span className="font-medium">R$ {parseFloat(c.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Detalhes de Troca / Moto de Entrada */}
                    {moto.moto_entrada_detalhes && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                          <RefreshCcw className="w-3.5 h-3.5" />
                          <span>Negócio com Moto de Entrada:</span>
                        </div>
                        <p className="text-amber-800 font-medium">
                          {moto.moto_entrada_detalhes.modelo} {moto.moto_entrada_detalhes.ano ? `(${moto.moto_entrada_detalhes.ano})` : ''} - Avaliada em: R$ {parseFloat(moto.moto_entrada_detalhes.valor_avaliacao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-600">
                        Preço Compra: <strong className="text-slate-800">R$ {(moto.preco_compra || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      </span>
                      <span className={`font-bold ${moto.lucro_real >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        Lucro Real: R$ {(moto.lucro_real || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                ) : (
                  /* Modo Edição Completa (Igual ao Estoque) */
                  <div className="space-y-3 pt-1 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium">Placa</label>
                        <input
                          type="text"
                          value={dadosEdicao.placa}
                          onChange={(e) => setDadosEdicao({ ...dadosEdicao, placa: e.target.value.toUpperCase() })}
                          className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-semibold uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium">Cor</label>
                        <input
                          type="text"
                          value={dadosEdicao.cor}
                          onChange={(e) => setDadosEdicao({ ...dadosEdicao, cor: e.target.value })}
                          className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium">Preço Compra (R$)</label>
                        <input
                          type="number"
                          value={dadosEdicao.preco_compra}
                          onChange={(e) => setDadosEdicao({ ...dadosEdicao, preco_compra: e.target.value })}
                          className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium">Preço Venda (R$)</label>
                        <input
                          type="number"
                          value={dadosEdicao.preco_venda}
                          onChange={(e) => setDadosEdicao({ ...dadosEdicao, preco_venda: e.target.value })}
                          className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-bold text-emerald-600"
                        />
                      </div>
                    </div>

                    {/* Gastos Adicionais na Edição */}
                    <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Gastos Adicionais</span>
                        <button
                          type="button"
                          onClick={handleAdicionarCustoEdicao}
                          className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:text-blue-700 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar Gasto
                        </button>
                      </div>

                      {dadosEdicao.custos_adicionais && dadosEdicao.custos_adicionais.length > 0 ? (
                        dadosEdicao.custos_adicionais.map((custo, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Ex: Oficina / Revisão"
                              value={custo.descricao}
                              onChange={(e) => handleAtualizarCustoEdicao(index, 'descricao', e.target.value)}
                              className="flex-1 p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                            />
                            <input
                              type="number"
                              placeholder="R$ 0,00"
                              value={custo.valor}
                              onChange={(e) => handleAtualizarCustoEdicao(index, 'valor', e.target.value)}
                              className="w-24 p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoverCustoEdicao(index)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic text-center py-1">Nenhum gasto adicional registrado.</p>
                      )}
                    </div>

                    {/* Prévia dos Novos Totais */}
                    <div className="bg-emerald-50 p-2.5 rounded-xl flex justify-between text-xs font-semibold text-emerald-900">
                      <span>Novo Custo Total: R$ {custoEditado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className={lucroEditado >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                        Novo Lucro Real: R$ {lucroEditado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-400">Nenhuma moto vendida registrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}