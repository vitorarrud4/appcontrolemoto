import React from 'react';
import { Wallet, ShoppingBag, DollarSign, TrendingUp, Bike, ArrowUpRight, Printer, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard({ motos = [] }) {
  const extrairNumero = (valor) => {
    if (!valor) return 0;
    if (typeof valor === 'number') return valor;

    let str = String(valor).trim();
    if (str.includes(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    }
    return Number(str.replace(/[^0-9.-]+/g, '')) || 0;
  };

  // Separação de estoques e vendidas
  const motosEstoque = motos.filter((moto) => !moto.status || moto.status === 'estoque');
  const motosVendidas = motos.filter((moto) => moto.status === 'vendida');

  const totalInvestido = motosEstoque.reduce((acc, m) => {
    if (m.custo_total) return acc + extrairNumero(m.custo_total);
    const compra = extrairNumero(m.preco_compra);
    const adicionais = Array.isArray(m.custos_adicionais) 
      ? m.custos_adicionais.reduce((soma, c) => soma + extrairNumero(c.valor), 0) 
      : 0;
    return acc + compra + adicionais;
  }, 0);

  const retornoEsperado = motosEstoque.reduce((acc, m) => acc + extrairNumero(m.preco_venda), 0);
  const lucroProjetado = retornoEsperado - totalInvestido;

  const patrimonioFipe = motosEstoque.reduce((acc, m) => {
    return acc + extrairNumero(m.fipe || m.preco_fipe || m.valor_fipe);
  }, 0);

  const roi = totalInvestido > 0 ? ((lucroProjetado / totalInvestido) * 100).toFixed(1) : 0;
  const lucroMedio = motosEstoque.length > 0 ? lucroProjetado / motosEstoque.length : 0;

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  // Função otimizada para impressão em formato Paisagem (Landscape)
  const exportarPDF = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    let conteudoTabela = motosEstoque.map((moto, index) => {
      const compra = extrairNumero(moto.preco_compra);
      const adicionais = Array.isArray(moto.custos_adicionais) 
        ? moto.custos_adicionais.reduce((soma, c) => soma + extrairNumero(c.valor), 0) 
        : 0;
      const totalCusto = moto.custo_total ? extrairNumero(moto.custo_total) : (compra + adicionais);
      const venda = extrairNumero(moto.preco_venda);
      const lucro = venda - totalCusto;

      return `
        <tr>
          <td>${index + 1}</td>
          <td><b>${moto.modelo || 'Moto'}</b><br><span style="color: #64748b; font-size: 11px;">Ano: ${moto.ano || '-'}</span></td>
          <td>${moto.placa ? `<span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1;">${moto.placa}</span>` : '-'}</td>
          <td>${formatarMoeda(totalCusto)}</td>
          <td>${formatarMoeda(venda)}</td>
          <td style="color: #15803d; font-weight: bold;">${formatarMoeda(lucro)}</td>
        </tr>
      `;
    }).join('');

    const janelaPrint = window.open('', '_blank');
    janelaPrint.document.write(`
      <html>
        <head>
          <title>Relatório de Estoque - MotoConta</title>
          <style>
            @page { size: landscape; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 15mm; margin-bottom: 20px; }
            .logo h2 { margin: 0; color: #0f172a; font-size: 20px; }
            .logo p { margin: 2px 0 0 0; color: #475569; font-size: 11px; }
            .date { text-align: right; color: #475569; font-size: 11px; }
            .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15mm; margin-bottom: 25px; }
            .card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 15px; }
            .card p { margin: 0; font-size: 9px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
            .card h3 { margin: 4px 0 0 0; font-size: 15px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background: #1e293b !important; color: #ffffff !important; text-align: left; padding: 8px 10px; font-weight: 600; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
            tr:nth-child(even) { background: #f8fafc; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <h2>MotoConta</h2>
              <p>Relatório Consolidado de Gestão de Estoque</p>
            </div>
            <div class="date">
              <b>Emitido em:</b> ${dataAtual}
            </div>
          </div>
          <div class="cards">
            <div class="card">
              <p>Total de Veículos</p>
              <h3>${motosEstoque.length} unidade(s)</h3>
            </div>
            <div class="card">
              <p>Capital Investido</p>
              <h3>${formatarMoeda(totalInvestido)}</h3>
            </div>
            <div class="card">
              <p>Retorno Esperado</p>
              <h3>${formatarMoeda(retornoEsperado)}</h3>
            </div>
            <div class="card" style="background: #f0fdf4; border-color: #86efac;">
              <p style="color: #166534;">Lucro Projetado</p>
              <h3 style="color: #15803d;">${formatarMoeda(lucroProjetado)}</h3>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Modelo / Ano</th>
                <th style="width: 120px;">Placa</th>
                <th style="width: 130px;">Custo Total</th>
                <th style="width: 130px;">Preço Venda</th>
                <th style="width: 130px;">Lucro Est.</th>
              </tr>
            </thead>
            <tbody>
              ${conteudoTabela.length > 0 ? conteudoTabela : '<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">Nenhuma moto cadastrada no estoque.</td></tr>'}
            </tbody>
          </table>
          <div class="footer">
            Gerado automaticamente pelo sistema MotoConta v1.0 • Documento de Auditoria e Controle Interno
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    janelaPrint.document.close();
  };

  // Gráfico 1: Evolução do Estoque
  const processarEvolucaoEstoque = () => {
    if (!motosEstoque.length) return [];

    const motosOrdenadas = [...motosEstoque].sort((a, b) => {
      const dataA = new Date(a.created_at || Date.now());
      const dataB = new Date(b.created_at || Date.now());
      return dataA - dataB;
    });

    let investidoAcumulado = 0;
    let lucroAcumulado = 0;
    const mapaMeses = {};

    motosOrdenadas.forEach((moto) => {
      const dataStr = moto.created_at;
      const data = dataStr ? new Date(dataStr) : new Date();
      const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      const custo = moto.custo_total ? extrairNumero(moto.custo_total) : (extrairNumero(moto.preco_compra) + (Array.isArray(moto.custos_adicionais) ? moto.custos_adicionais.reduce((s, c) => s + extrairNumero(c.valor), 0) : 0));
      const venda = extrairNumero(moto.preco_venda);
      const lucroMoto = venda - custo;

      investidoAcumulado += custo;
      lucroAcumulado += lucroMoto;

      mapaMeses[mesAno] = {
        periodo: mesAno.charAt(0).toUpperCase() + mesAno.slice(1),
        investido: investidoAcumulado,
        lucro: lucroAcumulado,
        timestamp: data.getTime()
      };
    });

    return Object.values(mapaMeses).sort((a, b) => a.timestamp - b.timestamp);
  };

  // Gráfico 2: Evolução das Vendas
  const processarEvolucaoVendas = () => {
    if (!motosVendidas.length) return [];

    const vendasOrdenadas = [...motosVendidas].sort((a, b) => {
      const dataA = new Date(a.updated_at || a.created_at || Date.now());
      const dataB = new Date(b.updated_at || b.created_at || Date.now());
      return dataA - dataB;
    });

    let faturamentoAcumulado = 0;
    let lucroRealAcumulado = 0;
    const mapaMesesVendas = {};

    vendasOrdenadas.forEach((moto) => {
      const dataStr = moto.updated_at || moto.created_at;
      const data = dataStr ? new Date(dataStr) : new Date();
      const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      const vendaReal = extrairNumero(moto.preco_venda);
      const lucroReal = extrairNumero(moto.lucro_real);

      faturamentoAcumulado += vendaReal;
      lucroRealAcumulado += lucroReal;

      mapaMesesVendas[mesAno] = {
        periodo: mesAno.charAt(0).toUpperCase() + mesAno.slice(1),
        faturamento: faturamentoAcumulado,
        lucroReal: lucroRealAcumulado,
        timestamp: data.getTime()
      };
    });

    return Object.values(mapaMesesVendas).sort((a, b) => a.timestamp - b.timestamp);
  };

  const dadosEvolucaoEstoque = processarEvolucaoEstoque();
  const dadosEvolucaoVendas = processarEvolucaoVendas();

  const dadosPizza = [
    { name: 'Capital Investido', value: totalInvestido, color: '#3b82f6' },
    { name: 'Lucro Projetado', value: lucroProjetado > 0 ? lucroProjetado : 0, color: '#22c55e' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* HEADER COM BOTÃO DE EXPORTAR PDF */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard Financeiro</h1>
            <p className="text-xs text-slate-500 font-medium">Visão geral do investimento</p>
          </div>
        </div>

        <button
          onClick={exportarPDF}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-semibold shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-blue-400" />
          <span>Exportar Relatório PDF</span>
        </button>
      </div>

      {/* CARDS SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Capital Investido</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{formatarMoeda(totalInvestido)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Compra + Gastos adicionais</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-500 rounded-2xl">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Retorno Esperado</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{formatarMoeda(retornoEsperado)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Soma do preço de venda</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-2xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Lucro Projetado</p>
            <h3 className="text-xl font-extrabold text-emerald-600 mt-1">{formatarMoeda(lucroProjetado)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Margem líquida estimada</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">ROI do Estoque</p>
            <h3 className="text-xl font-extrabold text-purple-600 mt-1">{roi}%</h3>
            <p className="text-[10px] text-slate-400 mt-1">Retorno sobre o investimento</p>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-500 rounded-2xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* CARDS SECUNDÁRIOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Patrimônio FIPE Total</p>
            <h3 className="text-xl font-extrabold mt-1">{formatarMoeda(patrimonioFipe)}</h3>
          </div>
          <Bike className="w-7 h-7 text-blue-400 opacity-80" />
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Lucro Médio / Moto</p>
            <h3 className="text-xl font-extrabold text-emerald-400 mt-1">{formatarMoeda(lucroMedio)}</h3>
          </div>
          <ArrowUpRight className="w-7 h-7 text-emerald-400 opacity-80" />
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Veículos no Estoque</p>
            <h3 className="text-xl font-extrabold mt-1">{motosEstoque.length} unidade(s)</h3>
          </div>
          <Bike className="w-7 h-7 text-purple-400 opacity-80" />
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Motos Vendidas</p>
            <h3 className="text-xl font-extrabold text-emerald-400 mt-1">{motosVendidas.length} unidade(s)</h3>
          </div>
          <CheckCircle2 className="w-7 h-7 text-emerald-400 opacity-80" />
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Evolução do Patrimônio e Lucro</h3>
              <p className="text-xs text-slate-400">Crescimento acumulado do capital investido e retorno estimado no estoque</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              Estoque
            </span>
          </div>

          {motosEstoque.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosEvolucaoEstoque} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="periodo" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, name) => [
                      formatarMoeda(value),
                      name === 'investido' ? 'Capital Investido Acumulado' : 'Lucro Projetado Acumulado'
                    ]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="investido" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorInvestido)" />
                  <Area type="monotone" dataKey="lucro" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorLucro)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              Nenhuma moto no estoque para exibir gráfico.
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Distribuição do Retorno</h3>
            <p className="text-xs text-slate-400">Proporção entre Investimento e Lucro</p>
          </div>

          {totalInvestido > 0 ? (
            <div className="h-52 w-full my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dadosPizza} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {dadosPizza.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatarMoeda(value)}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex justify-center gap-6 mt-2 text-xs font-semibold">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  Investido
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  Lucro
                </div>
              </div>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
              Sem dados financeiros.
            </div>
          )}
        </div>
      </div>

      {/* GRÁFICO DE VENDAS COM A MESMA VISUALIZAÇÃO PADRÃO */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Evolução das Vendas e Lucro Real</h3>
            <p className="text-xs text-slate-400">Crescimento acumulado do faturamento e lucro efetivo das motos vendidas</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
            Histórico de Vendas
          </span>
        </div>

        {motosVendidas.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosEvolucaoVendas} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLucroReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="periodo" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [
                    formatarMoeda(value),
                    name === 'faturamento' ? 'Faturamento Acumulado' : 'Lucro Real Acumulado'
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#ffffff' }}
                  itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="faturamento" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorFaturamento)" />
                <Area type="monotone" dataKey="lucroReal" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorLucroReal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            Nenhuma moto vendida registrada para exibir o gráfico de vendas.
          </div>
        )}
      </div>
    </div>
  );
}