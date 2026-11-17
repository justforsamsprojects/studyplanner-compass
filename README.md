# StudyPlanner — Planejador Acadêmico Inteligente 🎓

O **StudyPlanner** é uma aplicação web desenvolvida para ajudar estudantes a organizar sua rotina acadêmica, distribuir melhor o tempo de estudo e acompanhar seu progresso.

A proposta surgiu da necessidade de conciliar estudos, aulas, trabalho e compromissos pessoais, oferecendo um planejamento semanal personalizado de acordo com a disponibilidade e as necessidades de cada estudante.

🔗 **Acesse a aplicação:** https://studyplanner-compass.lovable.app

---

##  Objetivo do projeto

Desenvolver uma solução que facilite a organização dos estudos por meio de um planejamento automatizado, equilibrado e adaptado à realidade de cada estudante.

##  Funcionalidades

### Perfil do aluno

- Cadastro e autenticação de usuários.
- Registro de horários ocupados em uma grade semanal.
- Cadastro de disciplinas, datas de provas e níveis de dificuldade.
- Vinculação a disciplinas por código fornecido pelo professor.
- Geração automática de planos semanais de estudo.
- Distribuição de sessões de estudo de uma hora.
- Atualização automática do histórico de horas estudadas.
- Reorganização dos horários futuros ao gerar um novo plano.
- Caderno individual de anotações por disciplina.
- Painel com gráficos e indicadores de desempenho.
- Alertas sobre disponibilidade de tempo e proximidade das avaliações.
- Envio de pedidos de ajuda aos professores, com possibilidade de identificação anônima.

###  Perfil do professor

- Cadastro de disciplinas e avaliações.
- Geração de códigos para compartilhamento com estudantes.
- Recebimento e resposta a pedidos de ajuda.

*O fluxo de utilização do perfil de professor está em processo de validação e aprimoramento.*

##  Como funciona o planejamento automático?

O sistema analisa a rotina semanal cadastrada pelo estudante e identifica os períodos disponíveis entre 7h e 22h.

A distribuição das sessões considera:

- Proximidade das datas das provas.
- Nível de dificuldade das disciplinas.
- Limite de até três horas de estudo por dia.
- No máximo duas sessões consecutivas da mesma disciplina.

Ao concluir uma sessão, o sistema atualiza o histórico de estudos. Quando um novo plano é gerado, as horas já estudadas são preservadas e os horários futuros são recalculados.

##  Tecnologias e desenvolvimento

- **Lovable:** ferramenta utilizada na construção da aplicação com auxílio de inteligência artificial.
- **Algoritmo baseado em regras:** utilizado para distribuir e priorizar as sessões de estudo.

*As tecnologias específicas da implementação podem ser consultadas nos arquivos do projeto.*

##  Minha participação

Projeto acadêmico desenvolvido durante a formação em Análise e Desenvolvimento de Sistemas.

Participei da concepção da solução, identificação do problema, definição dos requisitos e funcionalidades, organização dos fluxos de utilização e construção da aplicação com auxílio do Lovable.

O desenvolvimento permitiu explorar o uso de ferramentas de inteligência artificial para transformar uma ideia em uma aplicação funcional.

##  Aprendizados e competências exploradas

- Identificação e estruturação de problemas.
- Pensamento lógico e definição de regras de negócio.
- Levantamento de requisitos e funcionalidades.
- Organização de fluxos e experiência do usuário.
- Desenvolvimento assistido por inteligência artificial.
- Construção e validação de soluções digitais.

##  Como executar localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/)
- npm (geralmente instalado junto com o Node.js).
- Git.

### Instalação

**1. Clone o repositório:**

```bash
git clone URL_DO_SEU_REPOSITORIO
```

**2. Acesse a pasta do projeto:**

```bash
cd NOME_DA_PASTA
```

**3. Instale as dependências:**

```bash
npm install
```

**4. Inicie o ambiente de desenvolvimento:**

```bash
npm run dev
```

Após iniciar, acesse o endereço local informado no terminal.

*Observação: confira as configurações e eventuais variáveis de ambiente necessárias no projeto antes de executar localmente.*

## 📌 Status do projeto

Aplicação publicada e funcional, com melhorias e validações em andamento.

---

Desenvolvido como projeto acadêmico da disciplina Engenharia de Software II, explorando a aplicação de tecnologia e inteligência artificial na criação de soluções para desafios cotidianos.
