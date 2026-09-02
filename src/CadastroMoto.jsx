import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Search, Check, DollarSign, Wrench, Bike, ChevronDown, CheckCircle2 } from 'lucide-react';
import { supabase } from './supabase';

// Componente Customizado para Select com Pesquisa
function SelectComBusca({ label, placeholder, buscaPlaceholder, opcoes, selecionado, onSelect, disabled }) {
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function handleClickFora(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const opcoesFiltradas = opcoes.filter((item) =>
    item.nome.toLowerCase().includes(termo.toLowerCase())
  );

  const itemAtual = opcoes.find((item) => String(item.codigo) === String(selecionado));

  return (
    <div className="relative w-full" ref={ref}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      
      {/* Botão do Campo */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAberto(!aberto)}
        className={`w-full p-2.5 bg-slate-50 border rounded-lg text-sm text-left flex justify-between items-center transition ${
          disabled ? 'opacity-50 cursor-not-allowed border-slate-200' : 'border-slate-300 hover:border-blue-400 focus:ring-2 focus:ring-blue-500'
        }`}
      >
        <span className={itemAtual ? 'text-slate-800 font-medium' : 'text-slate-400'}>
          {itemAtual ? itemAtual.nome : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {/* Menu Suspenso */}
      {aberto && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 flex flex-col">
          {/* Caixa de Busca Interna */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder={buscaPlaceholder}
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              className="w-full text-xs bg-transparent outline-none text-slate-700"
            />
          </div>

          {/* Lista de Opções com Scroll */}
          <div className="overflow-y-auto flex-1">
            {opcoesFiltradas.length > 0 ? (
              opcoesFiltradas.map((item) => (
                <button
                  key={item.codigo}
                  type="button"
                  onClick={() => {
                    onSelect(item.codigo);
                    setAberto(false);
                    setTermo('');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center transition hover:bg-blue-50 ${
                    String(selecionado) === String(item.codigo) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <span>{item.nome}</span>
                  {String(selecionado) === String(item.codigo) && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))
            ) : (
              <div className="p-3 text-xs text-slate-400 text-center">Nenhum resultado encontrado.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CadastroMoto({ onSalvarSucesso }) {
  // --- Estados do Formulário Básico ---
  const [placa, setPlaca] = useState('');
  const [cor, setCor] = useState('');
  const [precoCompra, setPrecoCompra] = useState('');
  const [precoVendaPretendido, setPrecoVendaPretendido] = useState('');

  // --- Estados FIPE ---
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [anos, setAnos] = useState([]);

  const [marcaSelecionada, setMarcaSelecionada] = useState('');
  const [modeloSelecionado, setModeloSelecionado] = useState('');
  const [anoSelecionado, setAnoSelecionado] = useState('');

  const [dadosFipe, setDadosFipe] = useState(null);
  const [loadingFipe, setLoadingFipe] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // --- Gastos Adicionais ---
  const [custos, setCustos] = useState([
    { id: 1, descricao: 'Oficina / Revisão', valor: '' },
    { id: 2, descricao: 'Documento / Transferência', valor: '' }
  ]);

  // 1. Carregar Marcas FIPE
  useEffect(() => {
    fetch('https://parallelum.com.br/fipe/api/v1/motos/marcas')
      .then((res) => res.json())
      .then((data) => setMarcas(data))
      .catch((err) => console.error('Erro ao buscar marcas FIPE:', err));
  }, []);

  // 2. Ao selecionar Marca
  const handleMarcaSelect = (idCodigo) => {
    setMarcaSelecionada(idCodigo);
    setModeloSelecionado('');
    setAnoSelecionado('');
    setModelos([]);
    setAnos([]);
    setDadosFipe(null);

    fetch(`https://parallelum.com.br/fipe/api/v1/motos/marcas/${idCodigo}/modelos`)
      .then((res) => res.json())
      .then((data) => setModelos(data.modelos || []))
      .catch((err) => console.error('Erro ao buscar modelos:', err));
  };

  // 3. Ao selecionar Modelo
  const handleModeloSelect = (idCodigo) => {
    setModeloSelecionado(idCodigo);
    setAnoSelecionado('');
    setAnos([]);
    setDadosFipe(null);

    fetch(`https://parallelum.com.br/fipe/api/v1/motos/marcas/${marcaSelecionada}/modelos/${idCodigo}/anos`)
      .then((res) => res.json())
      .then((data) => setAnos(data))
      .catch((err) => console.error('Erro ao buscar anos:', err));
  };

  // 4. Ao selecionar Ano
  const handleAnoSelect = (e) => {
    const idAno = e.target.value;
    setAnoSelecionado(idAno);

    if (idAno && marcaSelecionada && modeloSelecionado) {
      setLoadingFipe(true);
      fetch(`https://parallelum.com.br/fipe/api/v1/motos/marcas/${marcaSelecionada}/modelos/${modeloSelecionado}/anos/${idAno}`)
        .then((res) => res.json())
        .then((data) => {
          setDadosFipe(data);
          setLoadingFipe(false);
        })
        .catch((err) => {
          console.error('Erro ao buscar valor FIPE:', err);
          setLoadingFipe(false);
        });
    }
  };

  // --- Funções para Custos Dinâmicos ---
  const adicionarCusto = () => {
    setCustos([...custos, { id: Date.now(), descricao: '', valor: '' }]);
  };

  const removerCusto = (id) => {
    setCustos(custos.filter((c) => c.id !== id));
  };

  const atualizarCusto = (id, campo, valor) => {
    setCustos(
      custos.map((c) => (c.id === id ? { ...c, [campo]: valor } : c))
    );
  };

  // --- Limpar Formulário ---
  const limparFormulario = () => {
    setMarcaSelecionada('');
    setModeloSelecionado('');
    setAnoSelecionado('');
    setDadosFipe(null);
    setPlaca('');
    setCor('');
    setPrecoCompra('');
    setPrecoVendaPretendido('');
    setCustos([
      { id: 1, descricao: 'Oficina / Revisão', valor: '' },
      { id: 2, descricao: 'Documento / Transferência', valor: '' }
    ]);
  };

  // --- Cálculos ---
  const totalCustosAdicionais = custos.reduce(
    (acc, curr) => acc + (parseFloat(curr.valor) || 0),
    0
  );

  const valorCompraNum = parseFloat(precoCompra) || 0;
  const valorVendaNum = parseFloat(precoVendaPretendido) || 0;

  const custoTotalVeiculo = valorCompraNum + totalCustosAdicionais;
  const lucroEstimado = valorVendaNum - custoTotalVeiculo;

  // --- Ação de Salvar no Supabase ---
  const handleSalvar = async () => {
    if (!dadosFipe && !modeloSelecionado) {
      alert('Por favor, selecione o modelo e ano da moto!');
      return;
    }

    setSalvando(true);

    const novaMoto = {
      modelo: dadosFipe?.Modelo || 'Modelo não informado',
      marca: dadosFipe?.Marca || '',
      ano: dadosFipe?.AnoModelo ? String(dadosFipe.AnoModelo) : '',
      placa: placa,
      cor: cor,
      preco_compra: valorCompraNum,
      preco_venda: valorVendaNum,
      custos_adicionais: custos,
      custo_total: custoTotalVeiculo,
      lucro_estimado: lucroEstimado,
      valor_fipe: dadosFipe?.Valor || 'N/A'
    };

    try {
      const { data, error } = await supabase.from('motos').insert([novaMoto]).select();

      if (error) throw error;

      limparFormulario();

      if (onSalvarSucesso) {
        onSalvarSucesso(data);
      }
    } catch (error) {
      console.error('Erro ao salvar no Supabase:', error);
      alert('Erro ao salvar no banco de dados. Verifique a conexão/console.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen p-4 pb-12 font-sans text-slate-800">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 mb-6 border-b pb-3 border-slate-200">
        <Bike className="w-7 h-7 text-blue-600" />
        <h1 className="text-xl font-bold text-slate-900">Novo Cadastro de Moto</h1>
      </div>

      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        {/* Bloco 1: Seleção FIPE */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Search className="w-4 h-4" /> 1. Selecionar Modelo (FIPE)
          </h2>

          {/* Select Customizado de Marca */}
          <SelectComBusca
            label="Marca"
            placeholder="Selecione a marca..."
            buscaPlaceholder="Pesquisar marca (ex: Honda, Yamaha)..."
            opcoes={marcas}
            selecionado={marcaSelecionada}
            onSelect={handleMarcaSelect}
          />

          {/* Select Customizado de Modelo */}
          {modelos.length > 0 && (
            <SelectComBusca
              label="Modelo / Cilindrada"
              placeholder="Selecione o modelo..."
              buscaPlaceholder="Pesquisar modelo ou CC (ex: Titan, 160)..."
              opcoes={modelos}
              selecionado={modeloSelecionado}
              onSelect={handleModeloSelect}
            />
          )}

          {/* Select de Anos */}
          {anos.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ano / Combustível</label>
              <select
                value={anoSelecionado}
                onChange={handleAnoSelect}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Selecione o ano...</option>
                {anos.map((a) => (
                  <option key={a.codigo} value={a.codigo}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Resultado FIPE */}
          {loadingFipe && <p className="text-xs text-blue-600 italic">Buscando valor FIPE...</p>}
          {dadosFipe && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-blue-900">{dadosFipe.Modelo}</p>
                <p className="text-xs text-blue-700">Ano: {dadosFipe.AnoModelo}</p>
              </div>
              <span className="text-base font-bold text-blue-700">{dadosFipe.Valor}</span>
            </div>
          )}
        </div>

        {/* Bloco 2: Informações Básicas */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            2. Detalhes da Moto
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Placa</label>
              <input
                type="text"
                placeholder="ABC-1234"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cor</label>
              <input
                type="text"
                placeholder="Ex: Vermelha"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bloco 3: Precificação BÁSICA (Ajustado com grid responsivo) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-4 h-4" /> 3. Valores
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Preço de Compra (R$)</label>
              <input
                type="number"
                placeholder="0.00"
                value={precoCompra}
                onChange={(e) => setPrecoCompra(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Preço Venda Desejado (R$)</label>
              <input
                type="number"
                placeholder="0.00"
                value={precoVendaPretendido}
                onChange={(e) => setPrecoVendaPretendido(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bloco 4: Gastos e Reformas */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Wrench className="w-4 h-4" /> 4. Gastos Adicionais
            </h2>
            <button
              type="button"
              onClick={adicionarCusto}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Gasto
            </button>
          </div>

          <div className="space-y-2">
            {custos.map((custo) => (
              <div key={custo.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Descrição (ex: Pneu)"
                  value={custo.descricao}
                  onChange={(e) => atualizarCusto(custo.id, 'descricao', e.target.value)}
                  className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="R$ 0,00"
                  value={custo.valor}
                  onChange={(e) => atualizarCusto(custo.id, 'valor', e.target.value)}
                  className="w-24 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => removerCusto(custo.id)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo Final / Lucro Projetado */}
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Custo Total do Veículo:</span>
            <span className="font-semibold text-slate-200">
              R$ {custoTotalVeiculo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-slate-800 pt-2">
            <span>Lucro Projetado:</span>
            <span className={lucroEstimado >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              R$ {lucroEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Botão de Salvar */}
        <button
          type="button"
          onClick={handleSalvar}
          disabled={salvando}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
        >
          <CheckCircle2 className="w-5 h-5" />
          {salvando ? 'Salvando no Banco...' : 'Salvar Moto no Estoque'}
        </button>
      </form>
    </div>
  );
}