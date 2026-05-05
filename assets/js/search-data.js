// Índice de busca do site Concurseira PCD
// Adicione novos itens aqui conforme criar conteúdo
const SEARCH_DATA = [
  {
    title: 'Início',
    url: 'index.html',
    description: 'Página inicial do Concurseira PCD. Conteúdo sobre estudos, organização e acessibilidade.',
    keywords: 'início home concurso estudo organização acessibilidade pcd materiais gratuitos planners checklists',
    category: 'Página'
  },
  {
    title: 'Sobre Mim — Pâmela Dayane',
    url: 'sobre.html',
    description: 'Amputada, TDAH, aprovada na OAB aos 20 e no TRF1 aos 21. Criadora do Concurseira PCD.',
    keywords: 'sobre pamela dayane amputada tdah oab trf1 tjpe trf5 upe servidora aprovação concurseira pcd história',
    category: 'Página'
  },
  {
    title: 'Direitos PCD',
    url: 'direitos-pcd.html',
    description: 'Informação acessível sobre direitos das pessoas com deficiência: acessibilidade, benefícios, saúde, educação, trabalho e concursos.',
    keywords: 'direitos pcd pessoa deficiência acessibilidade benefícios bpc loas cadúnico saúde laudo cid educação trabalho cotas concurso biopsicossocial inclusão',
    category: 'Direitos PCD'
  },
  {
    title: 'Acessibilidade',
    url: 'direitos-pcd.html',
    description: 'Barreiras, atendimento prioritário, acessibilidade digital, adaptação razoável e inclusão no cotidiano.',
    keywords: 'acessibilidade barreiras adaptação razoável inclusão digital atendimento prioritário',
    category: 'Direitos PCD'
  },
  {
    title: 'Benefícios Sociais PCD — BPC e LOAS',
    url: 'direitos-pcd.html',
    description: 'BPC/LOAS, CadÚnico, documentos, renda familiar, perícias e organização de laudos.',
    keywords: 'bpc loas benefício assistência social cadúnico renda perícia inss laudo pcd',
    category: 'Direitos PCD'
  },
  {
    title: 'Saúde e Laudos PCD',
    url: 'direitos-pcd.html',
    description: 'Laudos, relatórios, exames, CID, funcionalidade e avaliação biopsicossocial.',
    keywords: 'laudo cid relatório exame saúde biopsicossocial avaliação funcionalidade pcd perícia',
    category: 'Direitos PCD'
  },
  {
    title: 'Concursos Públicos para PCD',
    url: 'direitos-pcd.html',
    description: 'Cotas PCD, edital, laudos, atendimento especial, avaliação biopsicossocial e rotina de estudos acessível.',
    keywords: 'concurso pcd cota edital atendimento especial laudo biopsicossocial banca prova acessível',
    category: 'Direitos PCD'
  },
  {
    title: 'O que é considerado pessoa com deficiência?',
    url: 'direitos-pcd.html',
    description: 'Guia introdutório com conceitos importantes sobre deficiência em linguagem acessível.',
    keywords: 'pcd pessoa deficiência conceito lei inclusão biopsicossocial cid laudo avaliação física intelectual sensorial',
    category: 'Direitos PCD'
  },
  {
    title: 'Como organizar documentos e laudos PCD',
    url: 'direitos-pcd.html',
    description: 'Passo a passo para manter laudos, relatórios e documentos sempre acessíveis.',
    keywords: 'laudo documentos relatórios organização pcd cid perícia médica benefícios pasta digital',
    category: 'Direitos PCD'
  },
  {
    title: 'Avaliação biopsicossocial — o que é?',
    url: 'direitos-pcd.html',
    description: 'Explicação sobre funcionalidade, barreiras e participação social na avaliação biopsicossocial.',
    keywords: 'biopsicossocial avaliação funcionalidade barreiras participação social pcd inss benefício lei',
    category: 'Direitos PCD'
  },
  {
    title: 'Blog da Concurseira',
    url: 'blog.html',
    description: 'Métodos de estudo, organização, dicas práticas, desabafos e reflexões sobre a rotina real de estudos.',
    keywords: 'blog métodos estudo revisão espaçada rotina organização dicas desabafos cansaço pausa permanência',
    category: 'Blog'
  },
  {
    title: 'Como revisar para concursos sem esquecer tudo',
    url: 'blog.html#metodos',
    description: 'Um roteiro para usar revisão espaçada, questões e caderno de erros com mais estratégia.',
    keywords: 'revisão espaçada concurso estratégia caderno erros questões métodos memorização curva esquecimento',
    category: 'Blog'
  },
  {
    title: 'Como montar uma rotina realista para concursos',
    url: 'blog.html#organizacao',
    description: 'Como organizar a semana sem depender de uma rotina perfeita.',
    keywords: 'rotina realista organização semana estudo concurso planejamento horas produtividade',
    category: 'Blog'
  },
  {
    title: 'O que eu faria diferente se começasse hoje',
    url: 'blog.html#dicas',
    description: 'Reflexões para evitar excesso de material, falta de revisão e metas irreais.',
    keywords: 'dicas recomeçar erros material excesso revisão metas realistas concurso iniciante',
    category: 'Blog'
  },
  {
    title: 'Quando descansar parece culpa',
    url: 'blog.html#desabafos',
    description: 'Um texto sobre exaustão, pausa necessária e como permanecer nos estudos.',
    keywords: 'descanso culpa exaustão pausa cansaço saúde mental estudo concurso equilíbrio tdah',
    category: 'Blog'
  },
  {
    title: 'Notícias de Concursos',
    url: 'noticias.html',
    description: 'Editais abertos, concursos previstos e oportunidades para candidatos PCD.',
    keywords: 'notícias concursos editais oportunidades vagas previstos candidatos pcd atendimento especial federal estadual',
    category: 'Notícias'
  },
  {
    title: 'Materiais Gratuitos',
    url: 'materiais-gratuitos.html',
    description: 'Checklists, planners e guias gratuitos para organizar seus estudos para concursos.',
    keywords: 'materiais gratuitos checklists planners guias organização estudo grátis download pdf',
    category: 'Materiais'
  },
  {
    title: 'Achadinhos de Estudo',
    url: 'achadinhos.html',
    description: 'Produtos e recursos para conforto, organização, tecnologia e acessibilidade no estudo.',
    keywords: 'achadinhos produtos estudo ergonomia conforto tecnologia acessibilidade organização fone cadeira mesa iluminação',
    category: 'Achadinhos'
  },
  {
    title: 'Produtos Digitais',
    url: 'produtos-digitais.html',
    description: 'Kits, planilhas, planners e manuais para uma preparação estruturada para concursos.',
    keywords: 'produtos digitais kits planilhas planners manuais preparação concurso estruturado comprar pcd',
    category: 'Produtos'
  },
  {
    title: 'Contato',
    url: 'contato.html',
    description: 'Fale com a Pâmela — dúvidas, parcerias ou sugestões para o Concurseira PCD.',
    keywords: 'contato mensagem dúvidas parcerias sugestões email formulário pamela',
    category: 'Página'
  },
];
