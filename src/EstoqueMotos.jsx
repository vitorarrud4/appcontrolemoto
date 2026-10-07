import React, { useState, useEffect } from 'react';
import { Search, Trash2, Pencil, Check, X, RefreshCw, Bike, Plus, DollarSign } from 'lucide-react';
import { supabase } from './supabase';

export default function EstoqueMotos({ motos = [], onAtualizar }) {
  const [termoBusca, setTermoBusca] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEdicao, setDadosEdicao] = useState({});
  const [salvando, setSalvando] = useState(false);

  // Estados para o Modal de Venda / Troca
  const [motoParaVenda, setMotoParaVenda] = useState(null);
  const [precoVendaReal, setPrecoVendaReal] = useState('');
  const [houveTroca, setHouveTroca] = useState(false);
  
  // Estados para a API FIPE da Moto de Entrada na Troca
  const [marcasApi, setMarcasApi] = useState([]);
  const [modelosApi, setModelosApi] = useState([]);
  const [anosApi, setAnosApi] = useState([]);
  
  const [marcaSelecionada, setMarcaSelecionada] = useState('');
  const [modeloSelecionado, setModeloSelecionado] = useState(null);
  const [anoSelecionado, setAnoSelecionado] = useState(null);

  const [placaEntrada, setPlacaEntrada] = useState('');
  const [corEntrada, setCorEntrada] = useState('');
  const [valorCompraEntrada, setValorCompraEntrada] = useState('');
  const [precoVendaEntrada, setPrecoVendaEntrada] = useState('');
  const [valorFipeEntrada, setValorFipeEntrada] = useState('');
  const [custosEntrada, setCustosEntrada] = useState([]);

  // Carregar marcas da API FIPE ao abrir a troca
  useEffect(() => {
    if (houveTroca && marcasApi.length === 0) {
      fetch('https://parallelum.com.br/fipe/api/v1/motos/marcas')
        .then((res) => res.json())
        .then((data) => setMarcasApi(data))
        .catch((err) => console.error('Erro ao buscar marcas FIPE:', err));
    }
  }, [houveTroca]);

  // Carregar modelos quando a marca for alterada
  const handleSelecionarMarca = async (e) => {
    const codigoMarca = e.target.value;
    const marcaObj = marcasApi.find((m) => String(m.codigo) === String(codigoMarca));
    setMarcaSelecionada(marcaObj ? marcaObj.nome : '');
    setModeloSelecionado(null);
    setModelosApi([]);
    setAnosApi([]);
    setAnoSelecionado(null);
    setValorFipeEntrada('');

    if (codigoMarca) {
      try {
        const res = await fetch(`https://parallelum.com.br/fipe/api/v1/motos/marcas/${codigoMarca}/modelos`);
        const data = await res.json();
        setModelosApi(data.modelos || []);
      } catch (err) {
        console.error('Erro ao buscar modelos FIPE:', err);
      }
    }
  };

  // Carregar anos quando o modelo for alterado
  const handleSelecionarModelo = async (e) => {
    const codigoModelo = e.target.value;
    const modeloObj = modelosApi.find((m) => String(m.codigo) === String(codigoModelo));
    setModeloSelecionado(modeloObj || null);
    setAnosApi([]);
    setAnoSelecionado(null);
    setValorFipeEntrada('');

    if (marcaSelecionada && codigoModelo) {
      const marcaObj = marcasApi.find((m) => m.nome === marcaSelecionada);
      if (marcaObj) {
        try {
          const res = await fetch(`https://parallelum.com.br/fipe/api/v1/motos/marcas/${marcaObj.codigo}/modelos/${codigoModelo}/anos`);
          const data = await res.json();
          setAnosApi(data || []);
        } catch (err) {
          console.error('Erro ao buscar anos FIPE:', err);
        }
      }
    }
  };

  // Buscar valor FIPE exato ao selecionar o ano
  const handleSelecionarAno = async (e) => {
    const codigoAno = e.target.value;
    const anoObj = anosApi.find((a) => String(a.codigo) === String(codigoAno));
    setAnoSelecionado(anoObj || null);

    if (marcaSelecionada && modeloSelecionado && codigoAno) {
      const marcaObj = marcasApi.find((m) => m.nome === marcaSelecionada);
      if (marcaObj) {
        try {
          const res = await fetch(`https://parallelum.com.br/fipe/api/v1/motos/marcas/${marcaObj.codigo}/modelos/${modeloSelecionado.codigo}/anos/${codigoAno}`);
          const data = await res.json();
          setValorFipeEntrada(data.Valor || '');
        } catch (err) {
          console.error('Erro ao buscar valor FIPE:', err);
        }
      }
    }
  };

  // Filtragem de motos
  const motosFiltradas = motos.filter((moto) => {
    const termo = termoBusca.toLowerCase();
    return (
      moto.modelo?.toLowerCase().includes(termo) ||
      moto.marca?.toLowerCase().includes(termo) ||
      moto.placa?.toLowerCase().includes(termo)
    );
  });

  // Excluir Moto
  const handleExcluir = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta moto do estoque?')) return;

    try {
      const { error } = await supabase.from('motos').delete().eq('id', id);
      if (error) throw error;
      if (onAtualizar) onAtualizar();
    } catch (err) {
      console.error('Erro ao excluir moto:', err);
      alert('Erro ao excluir do banco de dados.');
    }
  };

  // Iniciar Edição
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

  const handleSalvarEdicao = async (id) => {
    setSalvando(true);
    const valorCompra = parseFloat(dadosEdicao.preco_compra) || 0;
    const valorVenda = parseFloat(dadosEdicao.preco_venda) || 0;

    const totalCustosAdicionais = (dadosEdicao.custos_adicionais || []).reduce(
      (acc, c) => acc + (parseFloat(c.valor) || 0),
      0
    );

    const custoTotalCalculado = valorCompra + totalCustosAdicionais;
    const lucroCalculado = valorVenda - custoTotalCalculado;

    const atualizacao = {
      placa: dadosEdicao.placa,
      cor: dadosEdicao.cor,
      preco_compra: valorCompra,
      preco_venda: valorVenda,
      custos_adicionais: dadosEdicao.custos_adicionais,
      custo_total: custoTotalCalculado,
      lucro_estimado: lucroCalculado
    };

    try {
      const { error } = await supabase.from('motos').update(atualizacao).eq('id', id);
      if (error) throw error;
      setEditandoId(null);
      if (onAtualizar) onAtualizar();
    } catch (err) {
      console.error('Erro ao atualizar moto:', err);
      alert('Erro ao salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  };

  // Custos extras da moto de entrada
  const handleAdicionarCustoEntrada = () => {
    setCustosEntrada([...custosEntrada, { descricao: '', valor: '' }]);
  };

  const handleRemoverCustoEntrada = (index) => {
    const custos = [...custosEntrada];
    custos.splice(index, 1);
    setCustosEntrada(custos);
  };

  const handleAtualizarCustoEntrada = (index, campo, valor) => {
    const custos = [...custosEntrada];
    custos[index][campo] = valor;
    setCustosEntrada(custos);
  };

  // Abrir Modal de Venda
  const handleAbrirVenda = (moto) => {
    setMotoParaVenda(moto);
    setPrecoVendaReal(moto.preco_venda || '');
    setHouveTroca(false);
    setMarcaSelecionada('');
    setModeloSelecionado(null);
    setAnoSelecionado(null);
    setModelosApi([]);
    setAnosApi([]);
    setPlacaEntrada('');
    setCorEntrada('');
    setValorCompraEntrada('');
    setPrecoVendaEntrada('');
    setValorFipeEntrada('');
    setCustosEntrada([]);
  };

  // Efetivar Venda / Troca
  const handleConfirmarVenda = async () => {
    if (!precoVendaReal) {
      alert('Informe o preço de venda!');
      return;
    }

    setSalvando(true);

    try {
      const precoVendaNum = parseFloat(precoVendaReal) || 0;
      const custoTotalMotoAtual = parseFloat(motoParaVenda.custo_total) || 0;
      const lucroRealCalculado = precoVendaNum - custoTotalMotoAtual;

      let detalhesTroca = null;

      if (houveTroca) {
        if (!modeloSelecionado || !valorCompraEntrada) {
          alert('Selecione o modelo da moto pela FIPE e preencha o Valor de Avaliação / Custo.');
          setSalvando(false);
          return;
        }

        const totalCustosEntrada = custosEntrada.reduce((acc, c) => acc + (parseFloat(c.valor) || 0), 0);
        const valorCompraEntradaNum = parseFloat(valorCompraEntrada) || 0;
        const precoVendaEntradaNum = parseFloat(precoVendaEntrada) || 0;
        const custoTotalEntrada = valorCompraEntradaNum + totalCustosEntrada;
        const lucroEstimadoEntrada = precoVendaEntradaNum - custoTotalEntrada;

        const anoTexto = anoSelecionado ? anoSelecionado.nome.split(' ')[0] : '';

        detalhesTroca = {
          marca: marcaSelecionada,
          modelo: modeloSelecionado.nome,
          ano: anoTexto,
          placa: placaEntrada ? placaEntrada.toUpperCase() : null,
          cor: corEntrada,
          valor_avaliacao: valorCompraEntradaNum,
          valor_fipe: valorFipeEntrada
        };

        // 1. Cadastra a moto de entrada no estoque já com preço de venda e lucro calculados
        const novaMotoEstoque = {
          marca: marcaSelecionada,
          modelo: modeloSelecionado.nome,
          ano: anoTexto,
          placa: placaEntrada ? placaEntrada.toUpperCase() : null,
          cor: corEntrada,
          valor_fipe: valorFipeEntrada,
          preco_compra: valorCompraEntradaNum,
          custos_adicionais: custosEntrada,
          custo_total: custoTotalEntrada,
          preco_venda: precoVendaEntradaNum,
          lucro_estimado: lucroEstimadoEntrada,
          status: 'estoque'
        };

        const { error: errInserir } = await supabase.from('motos').insert([novaMotoEstoque]);
        if (errInserir) throw errInserir;
      }

      // 2. Atualiza a moto atual para VENDIDA
      const dadosAtualizacaoVenda = {
        status: 'vendida',
        tipo_venda: houveTroca ? 'troca' : 'dinheiro',
        preco_venda: precoVendaNum,
        lucro_real: lucroRealCalculado,
        moto_entrada_detalhes: detalhesTroca
      };

      const { error: errAtualizar } = await supabase
        .from('motos')
        .update(dadosAtualizacaoVenda)
        .eq('id', motoParaVenda.id);

      if (errAtualizar) throw errAtualizar;

      setMotoParaVenda(null);
      if (onAtualizar) onAtualizar();
      alert('Venda registrada com sucesso!');
    } catch (err) {
      console.error('Erro ao registrar venda:', err);
      alert('Erro ao registrar a venda no banco de dados.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 font-sans text-slate-800">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Bike className="w-7 h-7 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-900">Estoque de Motos</h1>
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
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
        />
      </div>

      {/* Lista de Cards */}
      <div className="space-y-4">
        {motosFiltradas.length > 0 ? (
          motosFiltradas.map((moto) => {
            const estaEditando = editandoId === moto.id;

            const totalAdicionais = (dadosEdicao.custos_adicionais || []).reduce(
              (acc, c) => acc + (parseFloat(c.valor) || 0),
              0
            );
            const custoEditado = (parseFloat(dadosEdicao.preco_compra) || 0) + totalAdicionais;
            const lucroEditado = (parseFloat(dadosEdicao.preco_venda) || 0) - custoEditado;

            return (
              <div key={moto.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    {moto.marca && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {moto.marca}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-slate-900 mt-1">{moto.modelo}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    {!estaEditando ? (
                      <>
                        <button
                          onClick={() => handleAbrirVenda(moto)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition text-xs font-semibold cursor-pointer"
                          title="Registrar Venda"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Vendeu
                        </button>
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

                {!estaEditando ? (
                  <>
                    <p className="text-xs text-slate-500">
                      Ano: <span className="font-medium text-slate-700">{moto.ano || 'N/A'}</span> | Placa:{' '}
                      <span className="font-semibold text-slate-800">{moto.placa || 'N/A'}</span> | Cor:{' '}
                      <span className="font-medium text-slate-700">{moto.cor || 'N/A'}</span>
                    </p>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Tabela FIPE</span>
                        <span className="font-semibold text-slate-700">{moto.valor_fipe || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Custo Total</span>
                        <span className="font-semibold text-slate-700">
                          R$ {(moto.custo_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

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

                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-600">
                        Venda: <strong className="text-slate-800">R$ {(moto.preco_venda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      </span>
                      <span className={`font-bold ${moto.lucro_estimado >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        Lucro: R$ {(moto.lucro_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                ) : (
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
                          className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>

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

                    <div className="bg-blue-50 p-2.5 rounded-xl flex justify-between text-xs font-semibold text-blue-900">
                      <span>Novo Custo: R$ {custoEditado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className={lucroEditado >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                        Novo Lucro: R$ {lucroEditado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-400">Nenhuma moto encontrada no estoque.</p>
          </div>
        )}
      </div>

      {/* Modal de Registro de Venda / Troca */}
      {motoParaVenda && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Registrar Venda: {motoParaVenda.modelo}</h2>
              <button onClick={() => setMotoParaVenda(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preço Real da Venda (R$)</label>
                <input
                  type="number"
                  value={precoVendaReal}
                  onChange={(e) => setPrecoVendaReal(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2 border border-slate-300 rounded-xl text-sm font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={houveTroca}
                    onChange={(e) => setHouveTroca(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-800">Houve moto de entrada (Troca) nesta venda?</span>
                </label>
              </div>

              {/* Seção FIPE da Moto de Entrada */}
              {houveTroca && (
                <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-amber-900 uppercase">Selecionar Moto de Entrada (FIPE):</h3>
                  
                  <div>
                    <label className="block text-[10px] text-slate-600 font-medium">Marca *</label>
                    <select
                      onChange={handleSelecionarMarca}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none"
                    >
                      <option value="">Selecione a marca...</option>
                      {marcasApi.map((m) => (
                        <option key={m.codigo} value={m.codigo}>
                          {m.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-600 font-medium">Modelo *</label>
                    <select
                      onChange={handleSelecionarModelo}
                      disabled={!modelosApi.length}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none disabled:bg-slate-100"
                    >
                      <option value="">Selecione o modelo...</option>
                      {modelosApi.map((m) => (
                        <option key={m.codigo} value={m.codigo}>
                          {m.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-600 font-medium">Ano *</label>
                    <select
                      onChange={handleSelecionarAno}
                      disabled={!anosApi.length}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none disabled:bg-slate-100"
                    >
                      <option value="">Selecione o ano...</option>
                      {anosApi.map((a) => (
                        <option key={a.codigo} value={a.codigo}>
                          {a.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {valorFipeEntrada && (
                    <div className="bg-white p-2.5 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                      <span className="text-slate-500">Tabela FIPE de Referência:</span>
                      <span className="font-bold text-slate-800">{valorFipeEntrada}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-600 font-medium">Placa</label>
                      <input
                        type="text"
                        value={placaEntrada}
                        onChange={(e) => setPlacaEntrada(e.target.value.toUpperCase())}
                        placeholder="ABC-1234"
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs uppercase font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-medium">Cor</label>
                      <input
                        type="text"
                        value={corEntrada}
                        onChange={(e) => setCorEntrada(e.target.value)}
                        placeholder="Preta"
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-600 font-medium">Valor de Avaliação / Custo (R$) *</label>
                      <input
                        type="number"
                        value={valorCompraEntrada}
                        onChange={(e) => setValorCompraEntrada(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-amber-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-medium">Preço Venda Desejado (R$)</label>
                      <input
                        type="number"
                        value={precoVendaEntrada}
                        onChange={(e) => setPrecoVendaEntrada(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-emerald-700 outline-none"
                      />
                    </div>
                  </div>

                  {/* Gastos Adicionais da moto de entrada */}
                  <div className="space-y-2 pt-1 border-t border-amber-200/60">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-amber-900 uppercase">Gastos Iniciais (Revisão/Doc)</span>
                      <button
                        type="button"
                        onClick={handleAdicionarCustoEntrada}
                        className="text-[11px] text-blue-600 font-semibold hover:underline"
                      >
                        + Adicionar Gasto
                      </button>
                    </div>
                    {custosEntrada.map((c, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Descrição"
                          value={c.descricao}
                          onChange={(e) => handleAtualizarCustoEntrada(idx, 'descricao', e.target.value)}
                          className="flex-1 p-1 bg-white border border-slate-300 rounded text-xs"
                        />
                        <input
                          type="number"
                          placeholder="R$ 0"
                          value={c.valor}
                          onChange={(e) => handleAtualizarCustoEntrada(idx, 'valor', e.target.value)}
                          className="w-20 p-1 bg-white border border-slate-300 rounded text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoverCustoEntrada(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-amber-800 italic">
                    *(Esta moto será validada pela FIPE e adicionada automaticamente ao seu estoque com preço e lucro projetados).*
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setMotoParaVenda(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarVenda}
                disabled={salvando}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Confirmar Venda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}