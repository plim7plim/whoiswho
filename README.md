# WHO'S WHO?

React + TypeScript + Vite, Tailwind CSS, Lucide e Supabase. Feed responsivo de enquetes com perfil, foto, criação de perguntas, voto único e Top 3 por enquete.

## Rodar

```sh
npm install
npm run dev
```

Sem variáveis de ambiente, abre em modo local com seis perguntas iniciais, sem perfis ou votos fictícios. Dados persistem no localStorage. Esse modo não compartilha dados entre dispositivos.

## Supabase

1. Crie um projeto e execute `supabase/schema.sql` no SQL Editor.
2. Em Authentication > Providers, habilite **Anonymous Sign-Ins**.
3. Copie `.env.example` para `.env`, preencha a URL e a chave pública anon/publishable do projeto e reinicie o Vite. Nunca use uma chave service_role no front-end.
4. Enquetes, perfis e votos passam a usar o PostgreSQL, fotos usam o bucket `avatars` e alterações chegam via Realtime.
5. Execute `supabase/starter-polls.sql` para adicionar as seis perguntas iniciais. Pode executar novamente sem duplicar. Também funciona em projetos que já usavam o schema anterior.

Cada novo perfil aparece em todas as enquetes, inclusive anteriores ao cadastro. O Realtime atualiza as opções nos outros dispositivos. Quem já votou mantém seu voto único.

O banco valida apelido único sem diferenciar maiúsculas, voto único por sessão/identidade, proibição de voto em si mesmo e autoria. Storage aceita JPG/PNG/WebP de até 10 MB. RLS impede editar outros perfis e alterar votos. As enquetes não expiram.

Para votar, selecione um amigo e depois confirme o nome. A seleção pode ser trocada ou cancelada antes de confirmar. Só a confirmação envia o voto ao banco. Atualizações do front-end preservam enquetes, usuários, fotos e votos existentes.

Cada enquete mostra o veredito parcial da roda: destaque para a liderança, empates explícitos, Top 3 com porcentagens de todos os votos e indicação do próprio voto confirmado. O texto acompanha a disputa e os resultados são atualizados por Realtime. As enquetes continuam abertas.

O botão **Print** em cada enquete abre uma versão compacta com a pergunta e o resultado completo, sem as opções de votação. É possível fechar pelo botão, tocando fora ou pressionando Escape. A visualização acompanha o placar em tempo real e foi conferida em telas de 360 × 640.

**Quem tá rendendo assunto?** reúne os destaques da rodada: quem recebeu votos em mais enquetes distintas, quem somou mais votos e quem lidera mais enquetes (incluindo empates). A seção é expansível e inclui um print do resumo. Os dados são recalculados com as atualizações em tempo real, sem salvar ou alterar placares.

Entrada anônima identifica a pessoa pelo navegador. Sair, apagar os dados do navegador ou usar outro dispositivo cria outra identidade; não há recuperação de conta nem garantia de uma identidade por pessoa física. Para uso público, configure CAPTCHA no Supabase e proteção contra abuso; com CAPTCHA habilitado, integre o desafio ao formulário antes de usar o cadastro anônimo. Todos os visitantes do projeto veem a mesma roda; não há grupos privados.

## Verificar

```sh
npm run build
npm test
```

O Supabase precisa ser configurado para validar os fluxos reais em múltiplos dispositivos.
