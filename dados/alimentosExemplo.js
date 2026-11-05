// Valores de referência ESTIMADOS para apresentação do TCC.
// Não são cotações garantidas de outubro/2026 ou ofertas reais.
// O preço para retirar os alimentos é GRATUITO.
export const ALIMENTOS_EXEMPLO = [
  { id: "paes", nome: "Kit 5 Pães Variados", estabelecimento: "Padaria Exemplo", categoria: "Padarias", quantidade: 5, unidade: "unidades", imagemChave: "paes", precoReferencia: 8.09, precoUnidade: "kit de 5", descricao: "Kit contendo 5 pães variados, ideal para o café da manhã ou lanche." },
  { id: "cesta", nome: "Cesta Básica", estabelecimento: "Mercado Comunitário", categoria: "Mercearia", quantidade: 1, unidade: "cestas", imagemChave: "cesta", precoReferencia: 124.99, precoUnidade: "cesta de referência", descricao: "Cesta de alimentos essenciais para preparar refeições da família." },
  { id: "macas", nome: "Maçãs frescas", estabelecimento: "Feira Solidária", categoria: "Hortifruti", quantidade: 8, unidade: "kg", imagemChave: "", precoReferencia: 16.99, precoUnidade: "kg", descricao: "Maçãs para consumo direto e preparo de receitas." },
  { id: "bananas", nome: "Bananas", estabelecimento: "Hortifruti Esperança", categoria: "Hortifruti", quantidade: 12, unidade: "kg", imagemChave: "", precoReferencia: 9.98, precoUnidade: "kg", descricao: "Bananas para lanches, vitaminas e receitas." },
  { id: "tomates", nome: "Tomates", estabelecimento: "Feira Solidária", categoria: "Hortifruti", quantidade: 10, unidade: "kg", imagemChave: "", precoReferencia: 17.98, precoUnidade: "kg", descricao: "Tomates para saladas, molhos e refeições." },
  { id: "cenouras", nome: "Cenouras", estabelecimento: "Hortifruti Esperança", categoria: "Hortifruti", quantidade: 6, unidade: "kg", imagemChave: "", precoReferencia: 11.98, precoUnidade: "kg", descricao: "Cenouras para saladas, sopas e refogados." },
  { id: "alface", nome: "Alface fresca", estabelecimento: "Horta Comunitária", categoria: "Hortifruti", quantidade: 20, unidade: "unidades", imagemChave: "", precoReferencia: 7.99, precoUnidade: "unidade", descricao: "Alface para saladas e acompanhamento de refeições." },
  { id: "arroz", nome: "Arroz 1 kg", estabelecimento: "Mercado Comunitário", categoria: "Mercearia", quantidade: 20, unidade: "pacotes", imagemChave: "", precoReferencia: 4.99, precoUnidade: "pacote de 1 kg", descricao: "Pacotes de arroz de 1 kg para refeições do dia a dia." },
  { id: "feijao", nome: "Feijão 1 kg", estabelecimento: "Mercado Comunitário", categoria: "Mercearia", quantidade: 15, unidade: "pacotes", imagemChave: "", precoReferencia: 8.79, precoUnidade: "pacote de 1 kg", descricao: "Pacotes de feijão de 1 kg para complementar refeições." },
  { id: "leite", nome: "Leite integral", estabelecimento: "Mercado Solidário", categoria: "Bebidas", quantidade: 24, unidade: "litros", imagemChave: "", precoReferencia: 5.79, precoUnidade: "litro", descricao: "Leite integral para consumo e preparo de receitas." },
  { id: "suco", nome: "Suco de fruta", estabelecimento: "Cantina Exemplo", categoria: "Bebidas", quantidade: 10, unidade: "litros", imagemChave: "", precoReferencia: 17.99, precoUnidade: "litro", descricao: "Suco de fruta para acompanhar refeições e lanches." },
  { id: "marmitas", nome: "Marmitas prontas", estabelecimento: "Cozinha Comunitária", categoria: "Refeições", quantidade: 15, unidade: "unidades", imagemChave: "", precoReferencia: 14.50, precoUnidade: "marmita", descricao: "Refeições individuais para ações solidárias." },
  { id: "sanduiches", nome: "Sanduíches naturais", estabelecimento: "Cantina Exemplo", categoria: "Refeições", quantidade: 12, unidade: "unidades", imagemChave: "", precoReferencia: 13.90, precoUnidade: "unidade", descricao: "Sanduíches naturais para lanches rápidos." },
  { id: "bolos", nome: "Fatias de bolo", estabelecimento: "Padaria Exemplo", categoria: "Padarias", quantidade: 18, unidade: "unidades", imagemChave: "", precoReferencia: 11.90, precoUnidade: "fatia", descricao: "Fatias de bolo para café da manhã e lanche." },
];

export const CATEGORIAS = ["Todas", "Hortifruti", "Padarias", "Refeições", "Bebidas", "Mercearia", "Outros"];
export function moeda(valor) {
  return typeof valor === "number" && Number.isFinite(valor)
    ? `R$ ${valor.toFixed(2).replace(".", ",")}`
    : "";
}
