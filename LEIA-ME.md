# Alimenta+ - restauração do protótipo

Projeto React Native/Expo com React Navigation, Firebase Auth e Cloud Firestore.

## Instalação

1. Instale Node.js 22.13+.
2. Abra esta pasta no VS Code, execute `npm install` e `npx expo install --fix`.
3. Em `firebase.js`, substitua o valor de `apiKey` pela chave correta do seu projeto. Confira também os outros campos no Firebase Console > Configurações do projeto > Seus apps.
4. No Firebase Console, ative Authentication > Email/Senha; Google, se usar no navegador. Para Google web, adicione localhost em Domínios autorizados, se necessário.
5. Abra Firestore Database > Regras e cole o conteúdo de `firestore.rules`. Clique em Publicar.
6. Execute `npx expo start -c` (pressione `w` para web).
7. Cadastre-se ou faça login. Na Home, clique em **Inserir 14 exemplos no Firestore**. Use **Atualizar preços** se seus documentos de demonstração já existirem.

## Importante

- NÃO crie outro projeto Firebase se as contas e o Firestore do `AlimentaMaisApp` continuam existindo.
- Os 14 alimentos são FICTÍCIOS. Os preços de referência são aproximações anteriores para o TCC, não preços confirmados em tempo real. A retirada dos alimentos cadastrados para demonstração não existe.
- Todas as doações do usuário são gravadas com `preco: "Gratuito"` e com o UID do usuário em `criadoPor`.
- Esta versão não implementa reserva, retirada, moderação sanitária ou gestão administrativa. Não utilize para doações reais sem implementar esses controles.
- Google popup só funciona na web. No Expo Go, use email/senha.
- O CPF exibido no cadastro é opcional e NÃO é armazenado.
- O logo, os pães, a cesta e o fundo de cadastro foram recuperados de arquivos disponíveis; as telas foram reconstruídas e podem diferir dos layouts originais.

## Pastas

- `App.js`: navegação e sessão
- `firebase.js`: configuração Firebase, com `apiKey` pendente
- `firebaseDb.js`: Firestore
- `dados/alimentosExemplo.js`: os 14 itens
- `Telas/`: telas do aplicativo
- `utils/responsive.js`: contexto responsivo
- `firestore.rules`: regras para publicar no console
