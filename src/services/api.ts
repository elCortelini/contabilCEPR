import initialData from '../../dados_financeiros_completos.json';

// Utility for static fallback on GitHub Pages
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

// Seed initial static storage if needed
if (IS_STATIC && typeof window !== 'undefined' && !localStorage.getItem('cepr_users')) {
  setStorage('users', initialData.tabelas.users.map((u: any) => ({ ...u, status: 'approved' })));
  setStorage('carteiras', initialData.tabelas.carteiras);
  setStorage('entradas', initialData.tabelas.entradas);
  setStorage('saidas', initialData.tabelas.saidas);
  setStorage('fornecedores', []);
  setStorage('produtos', []);
}

export const api = {
  async getDashboard() {
    if (!IS_STATIC) {
      const res = await fetch('/api/dashboard');
      if (res.ok) return res.json();
    }
    // Fallback static
    const carteiras = getStorage('carteiras', initialData.tabelas.carteiras);
    const entradas = getStorage('entradas', initialData.tabelas.entradas);
    const saidas = getStorage('saidas', initialData.tabelas.saidas);
    const fornecedores = getStorage('fornecedores', []);

    // Recalculate dynamic wallet balances
    const distribuicaoCarteiras = carteiras.map((c: any) => {
      const sumEnt = entradas.filter((e: any) => e.carteiraId === c.id).reduce((acc: number, e: any) => acc + (parseFloat(e.valor) || 0), 0);
      const sumSai = saidas.filter((s: any) => s.carteiraId === c.id).reduce((acc: number, s: any) => acc + (parseFloat(s.valor) || 0), 0);
      return { id: c.id, nome: c.nome, saldo: sumEnt - sumSai, tipo: c.tipo };
    });

    const saldoTotal = distribuicaoCarteiras.reduce((acc: number, c: any) => acc + c.saldo, 0);
    const totalEntradas = entradas.reduce((acc: number, e: any) => acc + (parseFloat(e.valor) || 0), 0);
    const totalSaidas = saidas.reduce((acc: number, s: any) => acc + (parseFloat(s.valor) || 0), 0);
    const pendenteFornecedores = fornecedores.reduce((acc: number, f: any) => acc + (parseFloat(f.saldoPendente) || 0), 0);

    // Fluxo de Caixa por mês
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
    const eRecentes = entradas.map((e: any) => ({ ...e, tipo: 'entrada', forma: e.formaRecebimento, carteiraNome: carteirasMap.get(e.carteiraId) || 'Carteira' }));
    const sRecentes = saidas.map((s: any) => ({ ...s, tipo: 'saida', forma: s.formaPagamento, carteiraNome: carteirasMap.get(s.carteiraId) || 'Carteira' }));
    const ultimasMovimentacoes = [...eRecentes, ...sRecentes]
      .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 10);

    return { saldoTotal, totalEntradas, totalSaidas, pendenteFornecedores, fluxoCaixa, distribuicaoCarteiras, ultimasMovimentacoes };
  },

  async getUsers() {
    if (!IS_STATIC) {
      const res = await fetch('/api/users');
      if (res.ok) return res.json();
    }
    return getStorage('users', initialData.tabelas.users.map((u: any) => ({ ...u, status: 'approved' })));
  },

  async approveUser(id: number) {
    if (!IS_STATIC) {
      await fetch(`/api/users/${id}/approve`, { method: 'PUT' });
      return;
    }
    const users = getStorage('users', []);
    const updated = users.map((u: any) => (u.id === id ? { ...u, status: 'approved' } : u));
    setStorage('users', updated);
  },

  async blockUser(id: number) {
    if (!IS_STATIC) {
      await fetch(`/api/users/${id}/block`, { method: 'PUT' });
      return;
    }
    const users = getStorage('users', []);
    const updated = users.map((u: any) => (u.id === id ? { ...u, status: 'blocked' } : u));
    setStorage('users', updated);
  },

  async updateUserRole(id: number, role: string) {
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
        status: 'pending', // New users need admin approval
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      setStorage('users', users);
    }
    return user;
  },

  async getCarteiras() {
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
    if (!IS_STATIC) {
      const res = await fetch('/api/entradas');
      if (res.ok) return res.json();
    }
    const carteirasMap = new Map((getStorage('carteiras', []) as any[]).map((c: any) => [c.id, c.nome]));
    const entradas = getStorage('entradas', []);
    return entradas.map((e: any) => ({ ...e, carteiraNome: carteirasMap.get(e.carteiraId) || 'Carteira' }));
  },

  async createEntrada(data: any) {
    if (!IS_STATIC) {
      const res = await fetch('/api/entradas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const entradas = getStorage('entradas', []);
    const newEntrada = { ...data, id: Date.now(), valor: parseFloat(data.valor), carteiraId: parseInt(data.carteiraId) };
    entradas.unshift(newEntrada);
    setStorage('entradas', entradas);
  },

  async deleteEntrada(id: number) {
    if (!IS_STATIC) {
      await fetch(`/api/entradas/${id}`, { method: 'DELETE' });
      return;
    }
    const entradas = getStorage('entradas', []).filter((e: any) => e.id !== id);
    setStorage('entradas', entradas);
  },

  async getSaidas() {
    if (!IS_STATIC) {
      const res = await fetch('/api/saidas');
      if (res.ok) return res.json();
    }
    const carteirasMap = new Map((getStorage('carteiras', []) as any[]).map((c: any) => [c.id, c.nome]));
    const saidas = getStorage('saidas', []);
    return saidas.map((s: any) => ({ ...s, carteiraNome: carteirasMap.get(s.carteiraId) || 'Carteira' }));
  },

  async createSaida(data: any) {
    if (!IS_STATIC) {
      const res = await fetch('/api/saidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const saidas = getStorage('saidas', []);
    const newSaida = { ...data, id: Date.now(), valor: parseFloat(data.valor), carteiraId: parseInt(data.carteiraId) };
    saidas.unshift(newSaida);
    setStorage('saidas', saidas);
  },

  async deleteSaida(id: number) {
    if (!IS_STATIC) {
      await fetch(`/api/saidas/${id}`, { method: 'DELETE' });
      return;
    }
    const saidas = getStorage('saidas', []).filter((s: any) => s.id !== id);
    setStorage('saidas', saidas);
  },

  async getFornecedores() {
    if (!IS_STATIC) {
      const res = await fetch('/api/fornecedores');
      if (res.ok) return res.json();
    }
    return getStorage('fornecedores', []);
  },

  async createFornecedor(data: any) {
    if (!IS_STATIC) {
      const res = await fetch('/api/fornecedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const fornecedores = getStorage('fornecedores', []);
    const newF = { ...data, id: Date.now(), saldoPendente: parseFloat(data.saldoPendente || 0) };
    fornecedores.push(newF);
    setStorage('fornecedores', fornecedores);
  },

  async getProdutos() {
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
    if (!IS_STATIC) {
      const res = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const produtos = getStorage('produtos', []);
    const newP = { ...data, id: Date.now() };
    produtos.push(newP);
    setStorage('produtos', produtos);
  }
};
