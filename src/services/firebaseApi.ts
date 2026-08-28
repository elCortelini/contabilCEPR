import { getFirebaseDb } from '../config/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import initialData from '../../dados_financeiros_completos.json';

export const firebaseApi = {
  isConfigured() {
    return !!getFirebaseDb();
  },

  async seedIfEmpty() {
    const db = getFirebaseDb();
    if (!db) return;

    try {
      const carteirasSnap = await getDocs(collection(db, 'carteiras'));
      if (!carteirasSnap.empty) return; // Already seeded

      console.log('🌱 Inicializando coleções do Firebase Firestore com o acervo migrado...');
      const batch = writeBatch(db);

      // Seed Users
      (initialData.tabelas.users || []).forEach((u: any) => {
        const ref = doc(db, 'users', u.id.toString());
        batch.set(ref, { ...u, status: 'approved' });
      });

      // Seed Carteiras
      (initialData.tabelas.carteiras || []).forEach((c: any) => {
        const ref = doc(db, 'carteiras', c.id.toString());
        batch.set(ref, c);
      });

      // Seed Entradas
      (initialData.tabelas.entradas || []).forEach((e: any, idx: number) => {
        const ref = doc(db, 'entradas', e.id.toString());
        batch.set(ref, {
          ...e,
          turno: e.turno || (idx % 2 === 0 ? 'Matutino' : 'Vespertino')
        });
      });

      // Seed Saidas
      (initialData.tabelas.saidas || []).forEach((s: any) => {
        const ref = doc(db, 'saidas', s.id.toString());
        batch.set(ref, s);
      });

      // Seed Categorias
      const defaultCategories = [
        { id: '1', nome: 'Vendas Cantina', tipo: 'entrada', cor: '#10b981' },
        { id: '2', nome: 'Mensalidades Escolares', tipo: 'entrada', cor: '#6366f1' },
        { id: '3', nome: 'Eventos & Festas', tipo: 'entrada', cor: '#f59e0b' },
        { id: '4', nome: 'Taxas de Matrícula', tipo: 'entrada', cor: '#06b6d4' },
        { id: '5', nome: 'Insumos Cantina', tipo: 'saida', cor: '#f43f5e' },
        { id: '6', nome: 'Material Didático', tipo: 'saida', cor: '#ec4899' },
        { id: '7', nome: 'Manutenção & Obras', tipo: 'saida', cor: '#ef4444' },
        { id: '8', nome: 'Alimentação & Bebidas', tipo: 'saida', cor: '#f97316' },
      ];
      defaultCategories.forEach((cat) => {
        const ref = doc(db, 'categorias', cat.id);
        batch.set(ref, cat);
      });

      await batch.commit();
      console.log('🎉 Firestore inicializado com sucesso!');
    } catch (e) {
      console.error('Erro ao semear Firestore:', e);
    }
  },

  async getCollection(colName: string) {
    const db = getFirebaseDb();
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, colName));
      return snap.docs.map((d) => ({ id: isNaN(Number(d.id)) ? d.id : Number(d.id), ...d.data() }));
    } catch (e) {
      console.error(`Erro ao buscar ${colName} do Firebase:`, e);
      return [];
    }
  },

  async setDocument(colName: string, id: string | number, data: any) {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      await setDoc(doc(db, colName, id.toString()), data, { merge: true });
    } catch (e) {
      console.error(`Erro ao salvar documento em ${colName}:`, e);
    }
  },

  async updateDocument(colName: string, id: string | number, data: any) {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      await updateDoc(doc(db, colName, id.toString()), data);
    } catch (e) {
      console.error(`Erro ao atualizar documento em ${colName}:`, e);
    }
  },

  async deleteDocument(colName: string, id: string | number) {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      await deleteDoc(doc(db, colName, id.toString()));
    } catch (e) {
      console.error(`Erro ao deletar documento em ${colName}:`, e);
    }
  }
};
