import initialData from '../../dados_financeiros_completos.json';

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

// Seed initial static storage
if (IS_STATIC && typeof window !== 'undefined' && !localStorage.getItem('cepr_users')) {
  setStorage('users', initialData.tabelas.users.map((u: any) => ({ ...u, status: 'approved' })));
  setStorage('carteiras', initialData.tabelas.carteiras);
  setStorage('entradas', initialData.tabelas.entradas);
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

export const api = {
  async getDashboard() {
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
    const eRecentes = entradas.map((e: any) => ({ ...e, tipo: 'entrada', forma: e.formaRecebimento, carteiraNome: carteirasMap.get(e.carteiraId) || 'Carteira' }));
    const sRecentes = saidas.map((s: any) => ({ ...s, tipo: 'saida', forma: s.formaPagamento, carteiraNome: carteirasMap.get(s.carteiraId) || 'Carteira' }));
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

  async getCategorias() {
    if (!IS_STATIC) {
      const res = await fetch('/api/categorias');
      if (res.ok) return res.json();
    }
    return getStorage('categorias', []);
  },

  async createCategoria(data: any) {
    if (!IS_STATIC) {
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const cats = getStorage('categorias', []);
    const newC = { ...data, id: Date.now() };
    cats.push(newC);
    setStorage('categorias', cats);
  },

  async deleteCategoria(id: number) {
    if (!IS_STATIC) {
      await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
      return;
    }
    const cats = getStorage('categorias', []).filter((c: any) => c.id !== id);
    setStorage('categorias', cats);
  },

  async getTurmas() {
    if (!IS_STATIC) {
      const res = await fetch('/api/turmas');
      if (res.ok) return res.json();
    }
    return getStorage('turmas', []);
  },

  async createTurma(data: any) {
    if (!IS_STATIC) {
      const res = await fetch('/api/turmas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const turmas = getStorage('turmas', []);
    const newT = { ...data, id: Date.now() };
    turmas.push(newT);
    setStorage('turmas', turmas);
  },

  async getAlunos() {
    if (!IS_STATIC) {
      const res = await fetch('/api/alunos');
      if (res.ok) return res.json();
    }
    return getStorage('alunos', []);
  },

  async createAluno(data: any) {
    if (!IS_STATIC) {
      const res = await fetch('/api/alunos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const turmasMap = new Map((getStorage('turmas', []) as any[]).map((t: any) => [t.id, t.nome]));
    const alunos = getStorage('alunos', []);
    const newA = { ...data, id: Date.now(), turmaId: parseInt(data.turmaId), turmaNome: turmasMap.get(parseInt(data.turmaId)) || 'Sem Turma', status: 'ativo' };
    alunos.push(newA);
    setStorage('alunos', alunos);
  },

  async getMensalidades() {
    if (!IS_STATIC) {
      const res = await fetch('/api/mensalidades');
      if (res.ok) return res.json();
    }
    return getStorage('mensalidades', []);
  },

  async createMensalidade(data: any) {
    if (!IS_STATIC) {
      const res = await fetch('/api/mensalidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
    const alunos = getStorage('alunos', []);
    const aluno = alunos.find((a: any) => a.id === parseInt(data.alunoId));
    const mensalidades = getStorage('mensalidades', []);
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
    mensalidades.unshift(newM);
    setStorage('mensalidades', mensalidades);
  },

  async payMensalidade(id: number, carteiraId: number, formaRecebimento: string) {
    if (!IS_STATIC) {
      await fetch(`/api/mensalidades/${id}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carteiraId, formaRecebimento }),
      });
      return;
    }
    const mensalidades = getStorage('mensalidades', []);
    const mens = mensalidades.find((m: any) => m.id === id);
    if (!mens) return;

    mens.status = 'pago';
    setStorage('mensalidades', mensalidades);

    // Create revenue entry
    await this.createEntrada({
      carteiraId,
      valor: mens.valor,
      descricao: `Mensalidade ${mens.mesReferencia} - Aluno: ${mens.alunoNome}`,
      formaRecebimento: formaRecebimento || 'pix',
      data: new Date().toISOString().split('T')[0]
    });
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
        status: 'pending',
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
    const categoriasMap = new Map((getStorage('categorias', []) as any[]).map((cat: any) => [cat.id, cat]));
    const entradas = getStorage('entradas', []);
    return entradas.map((e: any) => {
      const cat = categoriasMap.get(e.categoriaId);
      return { ...e, carteiraNome: carteirasMap.get(e.carteiraId) || 'Carteira', categoriaNome: cat?.nome, categoriaCor: cat?.cor };
    });
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
    const newEntrada = {
      ...data,
      id: Date.now(),
      valor: parseFloat(data.valor),
      carteiraId: parseInt(data.carteiraId),
      categoriaId: data.categoriaId ? parseInt(data.categoriaId) : null
    };
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
    const categoriasMap = new Map((getStorage('categorias', []) as any[]).map((cat: any) => [cat.id, cat]));
    const saidas = getStorage('saidas', []);
    return saidas.map((s: any) => {
      const cat = categoriasMap.get(s.categoriaId);
      return { ...s, carteiraNome: carteirasMap.get(s.carteiraId) || 'Carteira', categoriaNome: cat?.nome, categoriaCor: cat?.cor };
    });
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
    const newSaida = {
      ...data,
      id: Date.now(),
      valor: parseFloat(data.valor),
      carteiraId: parseInt(data.carteiraId),
      categoriaId: data.categoriaId ? parseInt(data.categoriaId) : null
    };
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
  },

  async exportBackupJSON() {
    if (!IS_STATIC) {
      window.open('/api/backup/export', '_blank');
      return;
    }
    const backupData = {
      formato: 'sistema-financeiro-escolar-export-v2',
      exportadoEm: new Date().toISOString(),
      tabelas: {
        users: getStorage('users', []),
        carteiras: getStorage('carteiras', []),
        entradas: getStorage('entradas', []),
        saidas: getStorage('saidas', []),
        fornecedores: getStorage('fornecedores', []),
        produtos: getStorage('produtos', []),
        categorias: getStorage('categorias', []),
        turmas: getStorage('turmas', []),
        alunos: getStorage('alunos', []),
        mensalidades: getStorage('mensalidades', []),
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
