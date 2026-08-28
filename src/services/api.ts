import initialData from '../../dados_financeiros_completos.json';
import { firebaseApi } from './firebaseApi';

const IS_STATIC = typeof window !== 'undefined' && !window.location.host.includes('localhost:3000') && !window.location.host.includes('localhost:5000');

function getStorage(key: string, defaultVal: any) {
  try {
    const item = localStorage.getItem(`cepr_${key}`);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStorage(key: string, val: any) {
  try {
    localStorage.setItem(`cepr_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error(e);
  }
}

// Seed initial static storage if static and not seeded
if (IS_STATIC && typeof window !== 'undefined' && !localStorage.getItem('cepr_users')) {
  setStorage('users', initialData.tabelas.users.map((u: any) => ({ ...u, status: 'approved' })));
  setStorage('carteiras', initialData.tabelas.carteiras);

  const seededEntradas = (initialData.tabelas.entradas || []).map((e: any, idx: number) => ({
    ...e,
    turno: e.turno || (idx % 2 === 0 ? 'Matutino' : 'Vespertino')
  }));
  setStorage('entradas', seededEntradas);
  setStorage('saidas', initialData.tabelas.saidas);
  setStorage('fornecedores', []);
  setStorage('produtos', []);
  setStorage('categorias', [
    { id: 1, nome: 'Vendas Cantina', tipo: 'entrada', cor: '#10b981' },
    { id: 2, nome: 'Mensalidades Escolares', tipo: 'entrada', cor: '#6366f1' },
    { id: 3, nome: 'Eventos & Festas', tipo: 'entrada', cor: '#f59e0b' },
    { id: 4, nome: 'Taxas de Matrícula', tipo: 'entrada', cor: '#06b6d4' },
    { id: 5, nome: 'Insumos Cantina', tipo: 'saida', cor: '#f43f5e' },
    { id: 6, nome: 'Material Didático', tipo: 'saida', cor: '#ec4899' },
    { id: 7, nome: 'Manutenção & Obras', tipo: 'saida', cor: '#ef4444' },
    { id: 8, nome: 'Alimentação & Bebidas', tipo: 'saida', cor: '#f97316' },
  ]);
  setStorage('turmas', [
    { id: 1, nome: '6º Ano A', anoLetivo: '2026', turno: 'Matutino' },
    { id: 2, nome: '7º Ano B', anoLetivo: '2026', turno: 'Vespertino' }
  ]);
  setStorage('alunos', [
    { id: 1, nome: 'Beatriz Cortelini', turmaId: 1, turmaNome: '6º Ano A', responsavel: 'Elevi Cortelini', contato: '(47) 99911-2233', status: 'ativo' },
    { id: 2, nome: 'Arthur Silva', turmaId: 1, turmaNome: '6º Ano A', responsavel: 'Roberto Silva', contato: '(47) 99944-5566', status: 'ativo' },
  ]);
  setStorage('mensalidades', [
    { id: 1, alunoId: 1, alunoNome: 'Beatriz Cortelini', responsavel: 'Elevi Cortelini', turmaNome: '6º Ano A', mesReferencia: '2026-08', valor: 450, vencimento: '2026-08-10', status: 'pago' },
    { id: 2, alunoId: 2, alunoNome: 'Arthur Silva', responsavel: 'Roberto Silva', turmaNome: '6º Ano A', mesReferencia: '2026-08', valor: 450, vencimento: '2026-08-10', status: 'pendente' },
  ]);
}

// Attempt Firebase seed if configured
if (firebaseApi.isConfigured()) {
  firebaseApi.seedIfEmpty();
}

export const api = {
  async getDashboard() {
    if (firebaseApi.isConfigured()) {
      const carteiras = (await firebaseApi.getCollection('carteiras')) as any[];
      const entradas = (await firebaseApi.getCollection('entradas')) as any[];
      const saidas = (await firebaseApi.getCollection('saidas')) as any[];
      const fornecedores = (await firebaseApi.getCollection('fornecedores')) as any[];
      const produtos = (await firebaseApi.getCollection('produtos')) as any[];

      const distribuicaoCarteiras = carteiras.map((c: any) => {
        const sumEnt = entradas.filter((e: any) => Number(e.carteiraId) === Number(c.id)).reduce((acc: number, e: any) => acc + (parseFloat(e.valor) || 0), 0);
        const sumSai = saidas.filter((s: any) => Number(s.carteiraId) === Number(c.id)).reduce((acc: number, s: any) => acc + (parseFloat(s.valor) || 0), 0);
        return { id: c.id, nome: c.nome, saldo: sumEnt - sumSai, tipo: c.tipo };
      });

      const saldoTotal = distribuicaoCarteiras.reduce((acc: number, c: any) => acc + c.saldo, 0);
      const totalEntradas = entradas.reduce((acc: number, e: any) => acc + (parseFloat(e.valor) || 0), 0);
      const totalSaidas = saidas.reduce((acc: number, s: any) => acc + (parseFloat(s.valor) || 0), 0);
      const pendenteFornecedores = fornecedores.reduce((acc: number, f: any) => acc + (parseFloat(f.saldoPendente) || 0), 0);

      const mesesMap = new Map<string, { mes: string; entradas: number; saidas: number; liquido: number }>();
      entradas.forEach((e: any) => {
        const mes = e.data ? e.data.substring(0, 7) : '';
        if (!mes) return;
        const curr = mesesMap.get(mes) || { mes, entradas: 0, saidas: 0, liquido: 0 };
        curr.entradas += parseFloat(e.valor) || 0;
        curr.liquido = curr.entradas - curr.saidas;
        mesesMap.set(mes, curr);
      });

      saidas.forEach((s: any) => {
        const mes = s.data ? s.data.substring(0, 7) : '';
        if (!mes) return;
        const curr = mesesMap.get(mes) || { mes, entradas: 0, saidas: 0, liquido: 0 };
        curr.saidas += parseFloat(s.valor) || 0;
        curr.liquido = curr.entradas - curr.saidas;
        mesesMap.set(mes, curr);
      });

      const fluxoCaixa = Array.from(mesesMap.values()).sort((a, b) => a.mes.localeCompare(b.mes));

      const carteirasMap = new Map(carteiras.map((c: any) => [Number(c.id), c.nome]));
      const eRecentes = entradas.map((e: any) => ({ ...e, tipo: 'entrada', forma: e.formaRecebimento, turno: e.turno || 'Matutino', carteiraNome: carteirasMap.get(Number(e.carteiraId)) || 'Carteira' }));
      const sRecentes = saidas.map((s: any) => ({ ...s, tipo: 'saida', forma: s.formaPagamento, turno: 'Geral', carteiraNome: carteirasMap.get(Number(s.carteiraId)) || 'Carteira' }));
      const ultimasMovimentacoes = [...eRecentes, ...sRecentes]
        .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 10);

      const produtosEstoqueBaixo = produtos.filter((p: any) => parseInt(p.quantidade || 0) <= 5);
      const fornecedoresPendentes = fornecedores.filter((f: any) => parseFloat(f.saldoPendente || 0) > 0);

      return {
        saldoTotal,
        totalEntradas,
        totalSaidas,
        pendenteFornecedores,
        fluxoCaixa,
        distribuicaoCarteiras,
        ultimasMovimentacoes,
        alertas: { produtosEstoqueBaixo, fornecedoresPendentes }
      };
    }

    if (!IS_STATIC) {
      const res = await fetch('/api/dashboard');
      if (res.ok) return res.json();
    }
    const carteiras = getStorage('carteiras', initialData.tabelas.carteiras);
    const entradas = getStorage('entradas', initialData.tabelas.entradas);
    const saidas = getStorage('saidas', initialData.tabelas.saidas);
    const fornecedores = getStorage('fornecedores', []);
    const produtos = getStorage('produtos', []);

    const distribuicaoCarteiras = carteiras.map((c: any) => {
      const sumEnt = entradas.filter((e: any) => e.carteiraId === c.id).reduce((acc: number, e: any) => acc + (parseFloat(e.valor) || 0), 0);
      const sumSai = saidas.filter((s: any) => s.carteiraId === c.id).reduce((acc: number, s: any) => acc + (parseFloat(s.valor) || 0), 0);
      return { id: c.id, nome: c.nome, saldo: sumEnt - sumSai, tipo: c.tipo };
    });

    const saldoTotal = distribuicaoCarteiras.reduce((acc: number, c: any) => acc + c.saldo, 0);
    const totalEntradas = entradas.reduce((acc: number, e: any) => acc + (parseFloat(e.valor) || 0), 0);
    const totalSaidas = saidas.reduce((acc: number, s: any) => acc + (parseFloat(s.valor) || 0), 0);
    const pendenteFornecedores = fornecedores.reduce((acc: number, f: any) => acc + (parseFloat(f.saldoPendente) || 0), 0);

    const mesesMap = new Map<string, { mes: string; entradas: number; saidas: number; liquido: number }>();
    entradas.forEach((e: any) => {
      const mes = e.data ? e.data.substring(0, 7) : '';
      if (!mes) return;
      const curr = mesesMap.get(mes) || { mes, entradas: 0, saidas: 0, liquido: 0 };
      curr.entradas += parseFloat(e.valor) || 0;
      curr.liquido = curr.entradas - curr.saidas;
      mesesMap.set(mes, curr);
    });

    saidas.forEach((s: any) => {
      const mes = s.data ? s.data.substring(0, 7) : '';
      if (!mes) return;
      const curr = mesesMap.get(mes) || { mes, entradas: 0, saidas: 0, liquido: 0 };
      curr.saidas += parseFloat(s.valor) || 0;
      curr.liquido = curr.entradas - curr.saidas;
      mesesMap.set(mes, curr);
    });

    const fluxoCaixa = Array.from(mesesMap.values()).sort((a, b) => a.mes.localeCompare(b.mes));

    const carteirasMap = new Map(carteiras.map((c: any) => [c.id, c.nome]));
    const eRecentes = entradas.map((e: any) => ({ ...e, tipo: 'entrada', forma: e.formaRecebimento, turno: e.turno || 'Matutino', carteiraNome: carteirasMap.get(e.carteiraId) || 'Carteira' }));
    const sRecentes = saidas.map((s: any) => ({ ...s, tipo: 'saida', forma: s.formaPagamento, turno: 'Geral', carteiraNome: carteirasMap.get(s.carteiraId) || 'Carteira' }));
    const ultimasMovimentacoes = [...eRecentes, ...sRecentes]
      .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 10);

    const produtosEstoqueBaixo = produtos.filter((p: any) => parseInt(p.quantidade || 0) <= 5);
    const fornecedoresPendentes = fornecedores.filter((f: any) => parseFloat(f.saldoPendente || 0) > 0);

    return { 
      saldoTotal, 
      totalEntradas, 
      totalSaidas, 
      pendenteFornecedores, 
      fluxoCaixa, 
      distribuicaoCarteiras, 
      ultimasMovimentacoes,
      alertas: { produtosEstoqueBaixo, fornecedoresPendentes }
    };
  },

  async getComparativoTurnos(inicio?: string, fim?: string) {
    if (firebaseApi.isConfigured()) {
      const entradas = (await firebaseApi.getCollection('entradas')) as any[];
      const filtered = entradas.filter((e: any) => {
        const itemDate = e.data ? e.data.substring(0, 10) : '';
        const matchesInicio = !inicio || itemDate >= inicio;
        const matchesFim = !fim || itemDate <= fim;
        return matchesInicio && matchesFim;
      });

      const result = {
        matutino: { total: 0, qtd: 0 },
        vespertino: { total: 0, qtd: 0 },
        noturno: { total: 0, qtd: 0 },
      };

      for (const e of filtered) {
        const t = (e.turno || 'Matutino').toLowerCase();
        if (t.includes('vespert')) {
          result.vespertino.total += parseFloat(e.valor) || 0;
          result.vespertino.qtd += 1;
        } else if (t.includes('noturn')) {
          result.noturno.total += parseFloat(e.valor) || 0;
          result.noturno.qtd += 1;
        } else {
          result.matutino.total += parseFloat(e.valor) || 0;
          result.matutino.qtd += 1;
        }
      }
      return result;
    }

    if (!IS_STATIC) {
      let url = '/api/relatorios/comparativo-turnos';
      const params = new URLSearchParams();
      if (inicio) params.append('inicio', inicio);
      if (fim) params.append('fim', fim);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url);
      if (res.ok) return res.json();
    }
    const entradas = getStorage('entradas', []);
    const filtered = entradas.filter((e: any) => {
      const itemDate = e.data ? e.data.substring(0, 10) : '';
      const matchesInicio = !inicio || itemDate >= inicio;
      const matchesFim = !fim || itemDate <= fim;
      return matchesInicio && matchesFim;
    });

    const result = {
      matutino: { total: 0, qtd: 0 },
      vespertino: { total: 0, qtd: 0 },
      noturno: { total: 0, qtd: 0 },
    };

    for (const e of filtered) {
      const t = (e.turno || 'Matutino').toLowerCase();
      if (t.includes('vespert')) {
        result.vespertino.total += parseFloat(e.valor) || 0;
        result.vespertino.qtd += 1;
      } else if (t.includes('noturn')) {
        result.noturno.total += parseFloat(e.valor) || 0;
        result.noturno.qtd += 1;
      } else {
        result.matutino.total += parseFloat(e.valor) || 0;
        result.matutino.qtd += 1;
      }
    }
    return result;
  },

  async getCategorias() {
    if (firebaseApi.isConfigured()) {
      return await firebaseApi.getCollection('categorias');
    }
    if (!IS_STATIC) {
      const res = await fetch('/api/categorias');
      if (res.ok) return res.json();
    }
    return getStorage('categorias', []);
  },

  async createCategoria(data: any) {
    const newC = { ...data, id: Date.now() };
    if (firebaseApi.isConfigured()) {
      await firebaseApi.setDocument('categorias', newC.id, newC);
      return newC;
    }
    if (!IS_STATIC) {
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const cats = getStorage('categorias', []);
    cats.push(newC);
    setStorage('categorias', cats);
  },

  async deleteCategoria(id: number) {
    if (firebaseApi.isConfigured()) {
      await firebaseApi.deleteDocument('categorias', id);
      return;
    }
    if (!IS_STATIC) {
      await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
      return;
    }
    const cats = getStorage('categorias', []).filter((c: any) => c.id !== id);
    setStorage('categorias', cats);
  },

  async getTurmas() {
    if (firebaseApi.isConfigured()) {
      return await firebaseApi.getCollection('turmas');
    }
    if (!IS_STATIC) {
      const res = await fetch('/api/turmas');
      if (res.ok) return res.json();
    }
    return getStorage('turmas', []);
  },

  async createTurma(data: any) {
    const newT = { ...data, id: Date.now() };
    if (firebaseApi.isConfigured()) {
      await firebaseApi.setDocument('turmas', newT.id, newT);
      return newT;
    }
    if (!IS_STATIC) {
      const res = await fetch('/api/turmas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const turmas = getStorage('turmas', []);
    turmas.push(newT);
    setStorage('turmas', turmas);
  },

  async getAlunos() {
    if (firebaseApi.isConfigured()) {
      return await firebaseApi.getCollection('alunos');
    }
    if (!IS_STATIC) {
      const res = await fetch('/api/alunos');
      if (res.ok) return res.json();
    }
    return getStorage('alunos', []);
  },

  async createAluno(data: any) {
    const turmas = (await this.getTurmas()) as any[];
    const turmasMap = new Map(turmas.map((t: any) => [Number(t.id), t.nome]));
    const newA = { ...data, id: Date.now(), turmaId: parseInt(data.turmaId), turmaNome: turmasMap.get(parseInt(data.turmaId)) || 'Sem Turma', status: 'ativo' };

    if (firebaseApi.isConfigured()) {
      await firebaseApi.setDocument('alunos', newA.id, newA);
      return newA;
    }
    if (!IS_STATIC) {
      const res = await fetch('/api/alunos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const alunos = getStorage('alunos', []);
    alunos.push(newA);
    setStorage('alunos', alunos);
  },

  async getMensalidades() {
    if (firebaseApi.isConfigured()) {
      return await firebaseApi.getCollection('mensalidades');
    }
    if (!IS_STATIC) {
      const res = await fetch('/api/mensalidades');
      if (res.ok) return res.json();
    }
    return getStorage('mensalidades', []);
  },

  async createMensalidade(data: any) {
    const alunos = (await this.getAlunos()) as any[];
    const aluno = alunos.find((a: any) => Number(a.id) === parseInt(data.alunoId));
    const newM = {
      ...data,
      id: Date.now(),
      alunoId: parseInt(data.alunoId),
      alunoNome: aluno ? aluno.nome : 'Aluno',
      responsavel: aluno ? aluno.responsavel : '',
      turmaNome: aluno ? aluno.turmaNome : '',
      valor: parseFloat(data.valor),
      status: 'pendente'
    };

    if (firebaseApi.isConfigured()) {
      await firebaseApi.setDocument('mensalidades', newM.id, newM);
      return newM;
    }
    if (!IS_STATIC) {
      const res = await fetch('/api/mensalidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const mensalidades = getStorage('mensalidades', []);
    mensalidades.unshift(newM);
    setStorage('mensalidades', mensalidades);
  },

  async payMensalidade(id: number, carteiraId: number, formaRecebimento: string) {
    const mensalidades = (await this.getMensalidades()) as any[];
    const mens = mensalidades.find((m: any) => Number(m.id) === id);
    if (!mens) return;

    mens.status = 'pago';

    if (firebaseApi.isConfigured()) {
      await firebaseApi.updateDocument('mensalidades', id, { status: 'pago' });
      await this.createEntrada({
        carteiraId,
        valor: mens.valor,
        descricao: `Mensalidade ${mens.mesReferencia} - Aluno: ${mens.alunoNome}`,
        formaRecebimento: formaRecebimento || 'pix',
        turno: 'Matutino',
        data: new Date().toISOString().split('T')[0]
      });
      return;
    }

    if (!IS_STATIC) {
      await fetch(`/api/mensalidades/${id}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carteiraId, formaRecebimento }),
      });
      return;
    }

    setStorage('mensalidades', mensalidades);
    await this.createEntrada({
      carteiraId,
      valor: mens.valor,
      descricao: `Mensalidade ${mens.mesReferencia} - Aluno: ${mens.alunoNome}`,
      formaRecebimento: formaRecebimento || 'pix',
      turno: 'Matutino',
      data: new Date().toISOString().split('T')[0]
    });
  },

  async getUsers() {
    if (firebaseApi.isConfigured()) {
      return await firebaseApi.getCollection('users');
    }
    if (!IS_STATIC) {
      const res = await fetch('/api/users');
      if (res.ok) return res.json();
    }
    return getStorage('users', initialData.tabelas.users.map((u: any) => ({ ...u, status: 'approved' })));
  },

  async approveUser(id: number) {
    if (firebaseApi.isConfigured()) {
      await firebaseApi.updateDocument('users', id, { status: 'approved' });
      return;
    }
    if (!IS_STATIC) {
      await fetch(`/api/users/${id}/approve`, { method: 'PUT' });
      return;
    }
    const users = getStorage('users', []);
    const updated = users.map((u: any) => (u.id === id ? { ...u, status: 'approved' } : u));
    setStorage('users', updated);
  },

  async blockUser(id: number) {
    if (firebaseApi.isConfigured()) {
      await firebaseApi.updateDocument('users', id, { status: 'blocked' });
      return;
    }
    if (!IS_STATIC) {
      await fetch(`/api/users/${id}/block`, { method: 'PUT' });
      return;
    }
    const users = getStorage('users', []);
    const updated = users.map((u: any) => (u.id === id ? { ...u, status: 'blocked' } : u));
    setStorage('users', updated);
  },

  async updateUserRole(id: number, role: string) {
    if (firebaseApi.isConfigured()) {
      await firebaseApi.updateDocument('users', id, { role });
      return;
    }
    if (!IS_STATIC) {
      await fetch(`/api/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      return;
    }
    const users = getStorage('users', []);
    const updated = users.map((u: any) => (u.id === id ? { ...u, role } : u));
    setStorage('users', updated);
  },

  async login(email: string, name?: string) {
    if (firebaseApi.isConfigured()) {
      const users = (await firebaseApi.getCollection('users')) as any[];
      let user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

      if (!user) {
        user = {
          id: Date.now(),
          openId: Math.random().toString(36).substring(2, 10),
          name: name || email.split('@')[0],
          email,
          loginMethod: 'google',
          role: 'user',
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        await firebaseApi.setDocument('users', user.id, user);
      }
      return user;
    }

    if (!IS_STATIC) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      if (res.ok) return res.json();
    }

    const users = getStorage('users', initialData.tabelas.users.map((u: any) => ({ ...u, status: 'approved' })));
    let user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      user = {
        id: Date.now(),
        openId: Math.random().toString(36).substring(2, 10),
        name: name || email.split('@')[0],
        email,
        loginMethod: 'google',
        role: 'user',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      setStorage('users', users);
    }
    return user;
  },

  async getCarteiras() {
    if (firebaseApi.isConfigured()) {
      const carteiras = (await firebaseApi.getCollection('carteiras')) as any[];
      const entradas = (await firebaseApi.getCollection('entradas')) as any[];
      const saidas = (await firebaseApi.getCollection('saidas')) as any[];

      return carteiras.map((c: any) => {
        const totalEntradas = entradas.filter((e: any) => Number(e.carteiraId) === Number(c.id)).reduce((acc: number, e: any) => acc + (parseFloat(e.valor) || 0), 0);
        const totalSaidas = saidas.filter((s: any) => Number(s.carteiraId) === Number(c.id)).reduce((acc: number, s: any) => acc + (parseFloat(s.valor) || 0), 0);
        return { ...c, totalEntradas, totalSaidas, saldoAtual: totalEntradas - totalSaidas };
      });
    }

    if (!IS_STATIC) {
      const res = await fetch('/api/carteiras');
      if (res.ok) return res.json();
    }

    const carteiras = getStorage('carteiras', initialData.tabelas.carteiras);
    const entradas = getStorage('entradas', []);
    const saidas = getStorage('saidas', []);

    return carteiras.map((c: any) => {
      const totalEntradas = entradas.filter((e: any) => e.carteiraId === c.id).reduce((acc: number, e: any) => acc + (parseFloat(e.valor) || 0), 0);
      const totalSaidas = saidas.filter((s: any) => s.carteiraId === c.id).reduce((acc: number, s: any) => acc + (parseFloat(s.valor) || 0), 0);
      return { ...c, totalEntradas, totalSaidas, saldoAtual: totalEntradas - totalSaidas };
    });
  },

  async getEntradas() {
    if (firebaseApi.isConfigured()) {
      const carteiras = (await firebaseApi.getCollection('carteiras')) as any[];
      const categorias = (await firebaseApi.getCollection('categorias')) as any[];
      const entradas = (await firebaseApi.getCollection('entradas')) as any[];

      const carteirasMap = new Map(carteiras.map((c: any) => [Number(c.id), c.nome]));
      const categoriasMap = new Map(categorias.map((cat: any) => [Number(cat.id), cat]));

      return entradas.map((e: any) => {
        const cat = categoriasMap.get(Number(e.categoriaId));
        return {
          ...e,
          turno: e.turno || 'Matutino',
          carteiraNome: carteirasMap.get(Number(e.carteiraId)) || 'Carteira',
          categoriaNome: cat?.nome,
          categoriaCor: cat?.cor
        };
      });
    }

    if (!IS_STATIC) {
      const res = await fetch('/api/entradas');
      if (res.ok) return res.json();
    }
    const carteirasMap = new Map((getStorage('carteiras', []) as any[]).map((c: any) => [c.id, c.nome]));
    const categoriasMap = new Map((getStorage('categorias', []) as any[]).map((cat: any) => [cat.id, cat]));
    const entradas = getStorage('entradas', []);
    return entradas.map((e: any) => {
      const cat = categoriasMap.get(e.categoriaId);
      return {
        ...e,
        turno: e.turno || 'Matutino',
        carteiraNome: carteirasMap.get(e.carteiraId) || 'Carteira',
        categoriaNome: cat?.nome,
        categoriaCor: cat?.cor
      };
    });
  },

  async createEntrada(data: any) {
    const newEntrada = {
      ...data,
      id: Date.now(),
      valor: parseFloat(data.valor),
      carteiraId: parseInt(data.carteiraId),
      categoriaId: data.categoriaId ? parseInt(data.categoriaId) : null,
      turno: data.turno || 'Matutino'
    };

    if (firebaseApi.isConfigured()) {
      await firebaseApi.setDocument('entradas', newEntrada.id, newEntrada);
      return newEntrada;
    }

    if (!IS_STATIC) {
      const res = await fetch('/api/entradas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const entradas = getStorage('entradas', []);
    entradas.unshift(newEntrada);
    setStorage('entradas', entradas);
  },

  async updateEntrada(id: number, data: any) {
    const updated = {
      ...data,
      valor: parseFloat(data.valor),
      carteiraId: parseInt(data.carteiraId),
      categoriaId: data.categoriaId ? parseInt(data.categoriaId) : null,
      turno: data.turno || 'Matutino'
    };

    if (firebaseApi.isConfigured()) {
      await firebaseApi.updateDocument('entradas', id, updated);
      return;
    }

    if (!IS_STATIC) {
      const res = await fetch(`/api/entradas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const entradas = getStorage('entradas', []);
    const list = entradas.map((e: any) => (e.id === id ? { ...e, ...updated } : e));
    setStorage('entradas', list);
  },

  async deleteEntrada(id: number) {
    if (firebaseApi.isConfigured()) {
      await firebaseApi.deleteDocument('entradas', id);
      return;
    }
    if (!IS_STATIC) {
      await fetch(`/api/entradas/${id}`, { method: 'DELETE' });
      return;
    }
    const entradas = getStorage('entradas', []).filter((e: any) => e.id !== id);
    setStorage('entradas', entradas);
  },

  async getSaidas() {
    if (firebaseApi.isConfigured()) {
      const carteiras = (await firebaseApi.getCollection('carteiras')) as any[];
      const categorias = (await firebaseApi.getCollection('categorias')) as any[];
      const saidas = (await firebaseApi.getCollection('saidas')) as any[];

      const carteirasMap = new Map(carteiras.map((c: any) => [Number(c.id), c.nome]));
      const categoriasMap = new Map(categorias.map((cat: any) => [Number(cat.id), cat]));

      return saidas.map((s: any) => {
        const cat = categoriasMap.get(Number(s.categoriaId));
        return { ...s, carteiraNome: carteirasMap.get(Number(s.carteiraId)) || 'Carteira', categoriaNome: cat?.nome, categoriaCor: cat?.cor };
      });
    }

    if (!IS_STATIC) {
      const res = await fetch('/api/saidas');
      if (res.ok) return res.json();
    }
    const carteirasMap = new Map((getStorage('carteiras', []) as any[]).map((c: any) => [c.id, c.nome]));
    const categoriasMap = new Map((getStorage('categorias', []) as any[]).map((cat: any) => [cat.id, cat]));
    const saidas = getStorage('saidas', []);
    return saidas.map((s: any) => {
      const cat = categoriasMap.get(s.categoriaId);
      return { ...s, carteiraNome: carteirasMap.get(s.carteiraId) || 'Carteira', categoriaNome: cat?.nome, categoriaCor: cat?.cor };
    });
  },

  async createSaida(data: any) {
    const newSaida = {
      ...data,
      id: Date.now(),
      valor: parseFloat(data.valor),
      carteiraId: parseInt(data.carteiraId),
      categoriaId: data.categoriaId ? parseInt(data.categoriaId) : null
    };

    if (firebaseApi.isConfigured()) {
      await firebaseApi.setDocument('saidas', newSaida.id, newSaida);
      return newSaida;
    }

    if (!IS_STATIC) {
      const res = await fetch('/api/saidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const saidas = getStorage('saidas', []);
    saidas.unshift(newSaida);
    setStorage('saidas', saidas);
  },

  async updateSaida(id: number, data: any) {
    const updated = {
      ...data,
      valor: parseFloat(data.valor),
      carteiraId: parseInt(data.carteiraId),
      categoriaId: data.categoriaId ? parseInt(data.categoriaId) : null
    };

    if (firebaseApi.isConfigured()) {
      await firebaseApi.updateDocument('saidas', id, updated);
      return;
    }

    if (!IS_STATIC) {
      const res = await fetch(`/api/saidas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const saidas = getStorage('saidas', []);
    const list = saidas.map((s: any) => (s.id === id ? { ...s, ...updated } : s));
    setStorage('saidas', list);
  },

  async deleteSaida(id: number) {
    if (firebaseApi.isConfigured()) {
      await firebaseApi.deleteDocument('saidas', id);
      return;
    }
    if (!IS_STATIC) {
      await fetch(`/api/saidas/${id}`, { method: 'DELETE' });
      return;
    }
    const saidas = getStorage('saidas', []).filter((s: any) => s.id !== id);
    setStorage('saidas', saidas);
  },

  async getFornecedores() {
    if (firebaseApi.isConfigured()) {
      return await firebaseApi.getCollection('fornecedores');
    }
    if (!IS_STATIC) {
      const res = await fetch('/api/fornecedores');
      if (res.ok) return res.json();
    }
    return getStorage('fornecedores', []);
  },

  async createFornecedor(data: any) {
    const newF = { ...data, id: Date.now(), saldoPendente: parseFloat(data.saldoPendente || 0) };

    if (firebaseApi.isConfigured()) {
      await firebaseApi.setDocument('fornecedores', newF.id, newF);
      return newF;
    }

    if (!IS_STATIC) {
      const res = await fetch('/api/fornecedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const fornecedores = getStorage('fornecedores', []);
    fornecedores.push(newF);
    setStorage('fornecedores', fornecedores);
  },

  async getProdutos() {
    if (firebaseApi.isConfigured()) {
      const produtos = (await firebaseApi.getCollection('produtos')) as any[];
      return produtos.map((p: any) => {
        const qtd = parseInt(p.quantidade || 0);
        const custo = parseFloat(p.custoUnitario || 0);
        const preco = parseFloat(p.precoUnitario || 0);
        const custoTotalEstoque = qtd * custo;
        const valorTotalVenda = qtd * preco;
        const lucroBruto = valorTotalVenda - custoTotalEstoque;
        return { ...p, custoTotalEstoque, valorTotalVenda, lucroBruto };
      });
    }

    if (!IS_STATIC) {
      const res = await fetch('/api/produtos');
      if (res.ok) return res.json();
    }
    const produtos = getStorage('produtos', []);
    return produtos.map((p: any) => {
      const qtd = parseInt(p.quantidade || 0);
      const custo = parseFloat(p.custoUnitario || 0);
      const preco = parseFloat(p.precoUnitario || 0);
      const custoTotalEstoque = qtd * custo;
      const valorTotalVenda = qtd * preco;
      const lucroBruto = valorTotalVenda - custoTotalEstoque;
      return { ...p, custoTotalEstoque, valorTotalVenda, lucroBruto };
    });
  },

  async createProduto(data: any) {
    const newP = { ...data, id: Date.now() };

    if (firebaseApi.isConfigured()) {
      await firebaseApi.setDocument('produtos', newP.id, newP);
      return newP;
    }

    if (!IS_STATIC) {
      const res = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const produtos = getStorage('produtos', []);
    produtos.push(newP);
    setStorage('produtos', produtos);
  },

  async exportBackupJSON() {
    if (!IS_STATIC && !firebaseApi.isConfigured()) {
      window.open('/api/backup/export', '_blank');
      return;
    }

    let users: any[] = [];
    let carteiras: any[] = [];
    let entradas: any[] = [];
    let saidas: any[] = [];
    let fornecedores: any[] = [];
    let produtos: any[] = [];
    let categorias: any[] = [];
    let turmas: any[] = [];
    let alunos: any[] = [];
    let mensalidades: any[] = [];

    if (firebaseApi.isConfigured()) {
      users = (await firebaseApi.getCollection('users')) as any[];
      carteiras = (await firebaseApi.getCollection('carteiras')) as any[];
      entradas = (await firebaseApi.getCollection('entradas')) as any[];
      saidas = (await firebaseApi.getCollection('saidas')) as any[];
      fornecedores = (await firebaseApi.getCollection('fornecedores')) as any[];
      produtos = (await firebaseApi.getCollection('produtos')) as any[];
      categorias = (await firebaseApi.getCollection('categorias')) as any[];
      turmas = (await firebaseApi.getCollection('turmas')) as any[];
      alunos = (await firebaseApi.getCollection('alunos')) as any[];
      mensalidades = (await firebaseApi.getCollection('mensalidades')) as any[];
    } else {
      users = getStorage('users', []);
      carteiras = getStorage('carteiras', []);
      entradas = getStorage('entradas', []);
      saidas = getStorage('saidas', []);
      fornecedores = getStorage('fornecedores', []);
      produtos = getStorage('produtos', []);
      categorias = getStorage('categorias', []);
      turmas = getStorage('turmas', []);
      alunos = getStorage('alunos', []);
      mensalidades = getStorage('mensalidades', []);
    }

    const backupData = {
      formato: 'sistema-financeiro-escolar-export-v2',
      exportadoEm: new Date().toISOString(),
      tabelas: {
        users,
        carteiras,
        entradas,
        saidas,
        fornecedores,
        produtos,
        categorias,
        turmas,
        alunos,
        mensalidades,
      }
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_financeiro_cepr_${new Date().toISOString().substring(0,10)}.json`;
    a.click();
  },

  async restoreBackupJSON(rawJsonText: string) {
    try {
      const data = JSON.parse(rawJsonText);
      if (!data.tabelas) throw new Error('Formato de backup inválido');

      if (firebaseApi.isConfigured()) {
        const t = data.tabelas;
        if (t.users) for (const item of t.users) await firebaseApi.setDocument('users', item.id, item);
        if (t.carteiras) for (const item of t.carteiras) await firebaseApi.setDocument('carteiras', item.id, item);
        if (t.entradas) for (const item of t.entradas) await firebaseApi.setDocument('entradas', item.id, item);
        if (t.saidas) for (const item of t.saidas) await firebaseApi.setDocument('saidas', item.id, item);
        if (t.fornecedores) for (const item of t.fornecedores) await firebaseApi.setDocument('fornecedores', item.id, item);
        if (t.produtos) for (const item of t.produtos) await firebaseApi.setDocument('produtos', item.id, item);
        if (t.categorias) for (const item of t.categorias) await firebaseApi.setDocument('categorias', item.id, item);
        if (t.turmas) for (const item of t.turmas) await firebaseApi.setDocument('turmas', item.id, item);
        if (t.alunos) for (const item of t.alunos) await firebaseApi.setDocument('alunos', item.id, item);
        if (t.mensalidades) for (const item of t.mensalidades) await firebaseApi.setDocument('mensalidades', item.id, item);
        return true;
      }

      if (data.tabelas.users) setStorage('users', data.tabelas.users);
      if (data.tabelas.carteiras) setStorage('carteiras', data.tabelas.carteiras);
      if (data.tabelas.entradas) setStorage('entradas', data.tabelas.entradas);
      if (data.tabelas.saidas) setStorage('saidas', data.tabelas.saidas);
      if (data.tabelas.fornecedores) setStorage('fornecedores', data.tabelas.fornecedores);
      if (data.tabelas.produtos) setStorage('produtos', data.tabelas.produtos);
      if (data.tabelas.categorias) setStorage('categorias', data.tabelas.categorias);
      if (data.tabelas.turmas) setStorage('turmas', data.tabelas.turmas);
      if (data.tabelas.alunos) setStorage('alunos', data.tabelas.alunos);
      if (data.tabelas.mensalidades) setStorage('mensalidades', data.tabelas.mensalidades);

      return true;
    } catch (e: any) {
      console.error(e);
      return false;
    }
  }
};
