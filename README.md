📊 Projeto de Gestão para Ação Social - IEADPE
Sistema web simples e funcional para gerenciar participantes e registrar presença em salas de atendimento durante a ação social promovida pela igreja IEADPE.

🎯 Objetivo
Desenvolver uma aplicação leve e eficiente que permita:

Cadastro rápido de participantes
Registro de presença em salas específicas
Geração de relatórios administrativos em tempo real
Exportação de dados para formato Excel (.xlsx)
⚙️ Funcionalidades
1. Cadastro de Participantes
Realizado por 3 voluntários com notebooks
Coleção de:
Nome completo
Número de telefone
Idade
Geração automática de ID sequencial (ex.: P001, P002, ...)
ID anotado em adesivo para identificação física
2. Registro de Presença nas Salas
10 salas disponíveis, cada uma com sua subpágina ( /sala1, /sala2, ..., /sala10)
O responsável pela sala digital o ID do participante
Sistema exibe Nome, Idade e Telefone
Botão “Confirmar Presença” salva o registro no banco
Prevenção de duplicidade: não permite registrar o mesmo participante duas vezes na mesma sala
3. Relatório Administrativo
Página de administração com dados em tempo real:
Quantidade de pessoas por sala
Dados e local de entrada de cada participante
Resumo final com todos os por sala
Exportação em .xlsxcom:
Nome, telefone, idade, ID, salas visitadas, horários de presença
🔄 Fluxo Operacional
Entrada: cadastro voluntário de pessoa → sistema gera ID → ID colado em adesivo
Durante o evento: participante apresenta ID nas salas → presença confirmada
Final do evento: administrador acessa relatório e exporta os dados
🧪 Tecnologias Utilizadas
Back-end: Node.js + Express
Banco de dados: SQLite (nível e sem servidor dedicado)
Front-end: HTML/CSS simples ou React (dependendo do tempo disponível)
Exportação XLSX: exceljs
Hospedagem: servidor local (notebook/PC) ou Railway/Heroku
📅 Prazos
Proposta pronta até quinta-feira
Sistema funcional até domingo
O MVP inclui:
Cadastro com ID único
Registro em salas
Relatório em tempo real
Exportação final em XLSX
✅ Resumo Final
O sistema será leve, rápido e prático, sem necessidade de QR Codes ou tecnologias complexas.
A identificação será feita por ID numérico em adesivo , e o relatório administrativo funcionará em tempo real.
Ao final, será possível baixar os dados em Excel , garantindo controle completo e facilitando a análise posterior.

🙌 Contribuição
Este projeto é voltado para fins sociais e comunitários.
Sugestões e melhorias são bem-vindas!
