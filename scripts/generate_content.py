"""
Concurseira PCD — Gerador automático de conteúdo diário
Gera 1 post por dia em: Noticias, Direitos PCD e Achadinhos

Regras de conteúdo:
- Noticias: apenas dados reais da fonte RSS. Sem inventar vagas, salários ou datas.
- Se nao houver noticia nova, nao publica. Nao inventa.
- Direitos PCD: baseado em legislação brasileira real (LBI, CF/88, INSS, etc.)
- Achadinhos: indicações honestas, com link de afiliada Shopee quando disponível.
- Proibido: travessão (--), dados inventados, afirmações sem fonte, conteúdo repetido.
"""

import google.generativeai as genai
import feedparser
import hashlib
import hmac
import json
import os
import re
import requests
import time
from datetime import date
from pathlib import Path

# --- CONFIG -----------------------------------------------------------------

ROOT = Path(__file__).parent.parent
TODAY = date.today()
TODAY_STR = TODAY.strftime("%d/%m/%Y")
TODAY_ISO = TODAY.isoformat()

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-1.5-flash")

SHOPEE_APP_ID = "1867320859"
URL_PUBLICADAS_FILE = Path(__file__).parent / "published_urls.txt"

REGRAS_GERAIS = """
REGRAS OBRIGATÓRIAS:
- Nunca use travessão (--) em nenhuma parte do texto.
- Use apenas virgula, ponto, dois-pontos ou ponto e virgula para pausas.
- Nunca invente dados, números, datas, nomes de órgaos ou valores que nao estejam na fonte fornecida.
- Se um dado nao estiver disponivel na fonte, escreva "a confirmar" ou omita o campo.
- Linguagem direta e simples. Sem adjetivos excessivos.
- Gere APENAS o bloco HTML solicitado, sem texto antes ou depois, sem markdown, sem explicacao.
"""

# --- FONTES RSS -------------------------------------------------------------

RSS_CONCURSOS = [
    "https://www.pciconcursos.com.br/rss/noticias.xml",
    "https://www.concursosnobrasil.com.br/rss.xml",
    "https://www.qconcursos.com/rss/concursos",
    "https://blog.grancursosonline.com.br/feed/",
    "https://www.estrategiaconcursos.com.br/blog/feed/",
]

RSS_INCLUSAO = [
    "https://www.diariodopcd.com.br/feed/",
    "https://jornalistainclusivo.com/feed/",
]

FONTES_LEGAIS = [
    "https://www.gov.br/pt-br/noticias/rss.xml",
    "https://www.tst.jus.br/rss/noticias",
]

KEYWORDS_RELEVANTES = [
    "federal", "edital", "inscricoes", "vagas", "pcd", "deficiencia",
    "nivel medio", "nivel superior", "analista", "tecnico", "servidor",
    "tribunal", "ministerio", "ibge", "receita", "inss", "trf", "tjdf",
    "concurso", "selecao publica", "processo seletivo",
]

# --- TOPICOS DIREITOS PCD ---------------------------------------------------

TOPICOS_PCD = [
    ("BPC/LOAS", "Lei 8.742/1993 e atualizacoes. Criterios de renda, avaliacao da deficiencia e como solicitar no INSS."),
    ("Cotas PCD em concursos publicos", "Lei 8.112/1990 art. 5 paragrafo 2 e Decreto 9.508/2018. Reserva de vagas e avaliacao biopsicossocial."),
    ("Laudo medico para concurso publico", "Decreto 9.508/2018. O que o laudo precisa conter, prazo de validade e como organizar a documentacao."),
    ("Atendimento especial em provas", "Decreto 9.508/2018 e editais de concursos. Tipos de adaptacao, prazo para solicitar e como formalizar o pedido."),
    ("Lei Brasileira de Inclusao", "Lei 13.146/2015. Principais direitos nas areas de saude, educacao, trabalho, transporte e acessibilidade."),
    ("Passe livre interestadual para PCD", "Lei 8.899/1994. Quem tem direito, como solicitar e quais modais de transporte estao incluidos."),
    ("Isencao de IR para PCD", "Lei 7.713/1988 art. 6. Doencas e deficiencias que dao direito, como declarar e documentacao necessaria."),
    ("Tecnologia assistiva pelo SUS", "Lei 13.146/2015 art. 14. O que o SUS deve fornecer, como solicitar e quais recursos estao disponiveis."),
    ("CadUnico para PCD", "Decreto 11.016/2022. Como cadastrar, quais beneficios estao vinculados e como atualizar os dados."),
    ("Aposentadoria por invalidez e PCD", "Lei 8.213/1991. Diferenca entre aposentadoria por invalidez e aposentadoria da pessoa com deficiencia (LC 142/2013)."),
    ("Direitos do PCD no trabalho", "Lei 8.213/1991 art. 93 e Lei 13.146/2015. Cotas em empresas, adaptacao razoavel e estabilidade."),
    ("Saude mental e deficiencia no SUS", "Lei 10.216/2001 e Portaria 3.088/2011. CAPS, RAPS e como acessar o servico pelo municipio."),
    ("Habilitacao especial para PCD", "Resolucao CONTRAN 425/2012. Categorias, adaptacoes de veiculo e processo no DETRAN."),
    ("Recursos contra resultado de avaliacao PCD em concurso", "Decreto 9.508/2018. Prazo para recorrer, fundamentacao e como organizar o recurso administrativo."),
    ("Documentacao para beneficios PCD: guia completo", "Baseado nas exigencias do INSS, CadUnico e Decreto 9.508/2018. Lista pratica de documentos por tipo de beneficio."),
]

# --- PRODUTOS SHOPEE --------------------------------------------------------
# URLs sem tracking params. Adicione mais produtos aqui conforme necessário.

PRODUTOS_SHOPEE = [
    {
        "nome": "Cadeira de Escritório Diretor Vegas com Apoio",
        "url": "https://shopee.com.br/Cadeira-de-Escrit%C3%B3rio-Diretor-Oficial-Vegas-com-Apoio-i.682804575.22298161342",
        "descricao": "Cadeira com apoio de braços e encosto regulável, indicada para longas sessões de estudo.",
        "keywords": ["cadeira", "ergonomica", "escritorio", "postura"],
    },
    {
        "nome": "Luminária com Controle Remoto e Base Magnética Recarregável",
        "url": "https://shopee.com.br/Lumin%C3%A1ria-de-Controle-Remoto-e-Base-Magn%C3%A9tica-Toque-Recarreg%C3%A1vel-com-3-Temperaturas-de-Cor-pr%C3%A1tico-i.1521699574.22099144556",
        "descricao": "Luminária recarregável com 3 temperaturas de cor e controle remoto, sem necessidade de fio.",
        "keywords": ["luminaria", "iluminacao", "luz", "lampada", "mesa"],
    },
    {
        "nome": "Escrivaninha Estilo Industrial 110cm",
        "url": "https://shopee.com.br/Escrivaninha-Mesa-Office-Estudo-Estilo-Industrial-110cm-KLM-M%C3%B3veis-i.1252074914.26586090555",
        "descricao": "Mesa de estudos estilo industrial com 110cm, ideal para organizar monitor, livros e materiais.",
        "keywords": ["mesa", "escrivaninha", "organizador", "organizadores"],
    },
    {
        "nome": "Suporte para Livros, Apostilas e Tablets",
        "url": "https://shopee.com.br/Suporte-Para-Livros-Apostilas-Tablets-Concurseiros-Leitura-i.293006935.7945195752",
        "descricao": "Suporte ajustável para leitura e estudo, compatível com livros, apostilas e tablets.",
        "keywords": ["suporte", "notebook", "livro", "apostila", "tablet", "leitura", "postura"],
    },
    {
        "nome": "Caderno Inteligente Recarregável A5/B5",
        "url": "https://shopee.com.br/Caderno-Inteligente-Recarregavel-A5-B5-Grande-Capa-Dura-80-Folhas-soltas-Desenho-e-Estudos-i.1366839880.23694232061",
        "descricao": "Caderno com folhas soltas removíveis e recarregáveis, capa dura e argolas.",
        "keywords": ["caderno", "digitalizavel", "inteligente", "folhas"],
    },
    {
        "nome": "Marca-Texto Faber-Castell Grifpen 4 Cores",
        "url": "https://shopee.com.br/Marca-Texto-FABER-CASTELL-Grifpen-4-Cores-Marcador-Destacar-Faber-Castell-i.1676312660.22994847230",
        "descricao": "Kit com 4 cores de marca-texto da Faber-Castell, ponta dupla e tinta de baixo odor.",
        "keywords": ["marca", "texto", "grifpen", "faber", "flashcard", "revisao", "anki"],
    },
    {
        "nome": "Marca-Texto Adesivo em Fita",
        "url": "https://shopee.com.br/Marca-Texto-Adesivo-Fina-Em-Fita-Kit-1-3-5-Cartelas-140x5mm-Cartela-160-Fitas-i.1526010563.23498819670",
        "descricao": "Marca-texto em fita adesiva removível: não borra, não atravessa o papel e é reutilizável.",
        "keywords": ["fita", "adesivo", "papelaria", "mao", "acessivel"],
    },
    {
        "nome": "Kit Papelaria 40-60 itens Vintage",
        "url": "https://shopee.com.br/Kit-papelaria-40-60-itens-Vintage-scrapbook-bullet-journal-diversos-i.407866840.22097330042",
        "descricao": "Kit variado com washi tapes, adesivos e marcadores para bullet journal e organização de caderno.",
        "keywords": ["papelaria", "kit", "bullet", "scrapbook", "mao", "acessivel"],
    },
    {
        "nome": "Bloco Post-It Notas Adesivas Transparentes 75x75mm",
        "url": "https://shopee.com.br/Bloco-Post-It-50-Unidades-Notas-Adesivas-Transparentes-75mm-x-75mm-Escola-Escrit%C3%B3rio-Bloquinho-Anota%C3%A7%C3%B5es-i.699088776.22120186028",
        "descricao": "Notas adesivas transparentes para marcar trechos sem cobrir o texto original do livro.",
        "keywords": ["post", "nota", "revisao", "anki", "flashcard"],
    },
    {
        "nome": "Apontador Elétrico Automático de Mesa",
        "url": "https://shopee.com.br/Apontador-el%C3%A9trico-autom%C3%A1tico-de-mesa-adequado-para-uso-em-escolas-estudantes-e-escrit%C3%B3rios(adequado-para-6-8-mm)-i.1420699091.40652678300",
        "descricao": "Apontador elétrico automático para canetas 6-8mm, prático para quem tem mobilidade reduzida.",
        "keywords": ["apontador", "eletrico", "acessivel"],
    },
    {
        "nome": "Kit Gabarito e Encadernação Papelaria",
        "url": "https://shopee.com.br/kit-Gabarito-Encaderna%C3%A7%C3%A3o-Cartonagem-Papelaria-Post-It-Esquadro-Wire-O-Mdf-i.374143267.20155753278",
        "descricao": "Kit com gabarito, esquadro e itens para encadernação: útil para organizar apostilas e fichas.",
        "keywords": ["gabarito", "encadernacao"],
    },
]

# --- CATEGORIAS ACHADINHOS --------------------------------------------------

CATEGORIAS_ACHADINHOS = [
    "Cadeira ergonomica para estudar: o que observar antes de comprar",
    "Fone de ouvido com cancelamento de ruido para foco nos estudos",
    "Organizadores de mesa para rotina de estudos",
    "Iluminacao adequada para estudar sem cansar a vista",
    "Aplicativos gratuitos uteis para concurseiros",
    "Mouse vertical e teclado ergonomico: quando vale a pena",
    "Como escolher entre livro fisico e PDF para concurso",
    "Flashcards e Anki: como usar para revisao de conteudo",
    "Suporte para notebook e postura ao estudar",
    "Tecnica Pomodoro e timers para quem tem dificuldade de concentracao",
    "Materiais de papelaria acessiveis para quem usa so uma mao",
    "Cadernos inteligentes e digitalizaveis: vale o investimento?",
]

# --- FUNCOES AUXILIARES -----------------------------------------------------

def escolher_por_data(lista: list):
    idx = TODAY.timetuple().tm_yday % len(lista)
    return lista[idx]


def normalizar(texto: str) -> str:
    """Remove acentos e converte para lowercase para comparacao."""
    texto = texto.lower()
    for c_orig, c_norm in [
        ("ç","c"),("ã","a"),("ê","e"),("ó","o"),("á","a"),
        ("í","i"),("ú","u"),("ô","o"),("â","a"),("é","e"),("è","e"),
    ]:
        texto = texto.replace(c_orig, c_norm)
    return texto


def remover_travessao(texto: str) -> str:
    return (
        texto.replace("\u2014", ",")
             .replace("\u2013", ",")
             .replace(" -- ", ", ")
             .replace("--", ",")
    )


def carregar_urls_publicadas() -> set:
    if URL_PUBLICADAS_FILE.exists():
        return set(URL_PUBLICADAS_FILE.read_text(encoding="utf-8").splitlines())
    return set()


def registrar_url_publicada(url: str):
    urls = carregar_urls_publicadas()
    urls.add(url)
    URL_PUBLICADAS_FILE.write_text("\n".join(sorted(urls)), encoding="utf-8")


def buscar_em_feeds(feeds: list, keywords: list, urls_ja_publicadas: set = None) -> dict | None:
    if urls_ja_publicadas is None:
        urls_ja_publicadas = set()
    for url in feeds:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:20]:
                link = entry.get("link", "")
                if link in urls_ja_publicadas:
                    continue  # já publicado, pula
                texto_norm = normalizar(
                    entry.get("title", "") + " " + entry.get("summary", "")
                )
                if any(kw in texto_norm for kw in keywords):
                    return {
                        "titulo": entry.get("title", ""),
                        "link": link,
                        "resumo": entry.get("summary", "")[:800],
                        "fonte": feed.feed.get("title", url),
                    }
        except Exception as e:
            print(f"  RSS falhou ({url}): {e}")
            continue
    return None


def buscar_noticia_rss() -> dict | None:
    urls_ja_publicadas = carregar_urls_publicadas()
    return buscar_em_feeds(RSS_CONCURSOS, KEYWORDS_RELEVANTES, urls_ja_publicadas)


def buscar_pauta_inclusao() -> dict | None:
    keywords_pcd = [
        "pcd", "deficiencia", "inclusao", "acessibilidade", "laudo",
        "biopsicossocial", "bpc", "loas", "lbi", "pessoa com deficiencia",
    ]
    return buscar_em_feeds(RSS_INCLUSAO + FONTES_LEGAIS, keywords_pcd)


def chamar_gemini(prompt: str) -> str:
    response = model.generate_content(prompt)
    texto = response.text.strip()
    texto = re.sub(r"```html\n?", "", texto)
    texto = re.sub(r"```\n?", "", texto)
    texto = remover_travessao(texto)
    return texto


def inserir_no_html(arquivo: Path, marcador: str, novo_bloco: str) -> bool:
    html = arquivo.read_text(encoding="utf-8")
    if marcador not in html:
        print(f"  Marcador '{marcador}' nao encontrado em {arquivo.name}")
        return False
    html = html.replace(marcador, marcador + "\n" + novo_bloco, 1)
    arquivo.write_text(html, encoding="utf-8")
    return True


# --- SHOPEE AFFILIATE -------------------------------------------------------

def gerar_link_afiliada_shopee(url_produto: str) -> str:
    """Gera link curto de afiliada Shopee. Retorna URL original se falhar."""
    app_secret = os.environ.get("SHOPEE_SECRET_KEY", "")
    if not app_secret:
        print("  SHOPEE_SECRET_KEY nao definido. Usando URL original.")
        return url_produto

    url_limpa = url_produto.split("?")[0]
    timestamp = int(time.time())
    nonce = hashlib.md5(f"{SHOPEE_APP_ID}{timestamp}".encode()).hexdigest()[:8]

    payload = json.dumps({
        "query": "mutation generateShortLink($input: GenerateShortLinkInput!) { generateShortLink(input: $input) { shortLink } }",
        "variables": {
            "input": {
                "originUrl": url_limpa,
                "subIds": ["concurseirapcd"]
            }
        }
    }, separators=(',', ':'))

    base_string = f"{SHOPEE_APP_ID}{nonce}{timestamp}{payload}"
    signature = hmac.new(
        app_secret.encode("utf-8"),
        base_string.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    headers = {
        "Content-Type": "application/json",
        "Authorization": (
            f"SHA256 Credential={SHOPEE_APP_ID},"
            f"NonceStr={nonce},"
            f"Timestamp={timestamp},"
            f"Signature={signature}"
        ),
    }

    try:
        resp = requests.post(
            "https://open-api.affiliate.shopee.com.br/graphql",
            data=payload,
            headers=headers,
            timeout=10,
        )
        data = resp.json()
        short_link = (
            data.get("data", {})
                .get("generateShortLink", {})
                .get("shortLink", "")
        )
        if short_link:
            print(f"  Link afiliada gerado: {short_link}")
            return short_link
        print(f"  Shopee API retorno inesperado: {data}")
        return url_limpa
    except Exception as e:
        print(f"  Shopee API falhou: {e}")
        return url_limpa


def encontrar_produto_shopee(categoria: str) -> dict | None:
    """Retorna o primeiro produto compatível com a categoria do dia."""
    cat_norm = normalizar(categoria)
    for produto in PRODUTOS_SHOPEE:
        if any(kw in cat_norm for kw in produto["keywords"]):
            return produto
    return None


# --- GERADORES --------------------------------------------------------------

def gerar_noticia():
    print("Gerando noticia...")
    noticia = buscar_noticia_rss()

    if not noticia:
        print("  Nenhuma noticia nova e relevante encontrada. Nao publicando.")
        return

    prompt = f"""
Voce escreve para o site Concurseira PCD, voltado para candidatos PCD em concursos publicos brasileiros.

{REGRAS_GERAIS}

IMPORTANTE: Use SOMENTE as informacoes abaixo. Nao complete dados que nao estao na fonte.
Se um campo como Banca, Vagas ou Salario nao aparecer na fonte, escreva "a confirmar".

FONTE REAL:
Titulo: {noticia['titulo']}
Fonte: {noticia['fonte']}
Link: {noticia['link']}
Conteudo: {noticia['resumo']}

Gere este bloco HTML:

<article class="news-card news-card--featured">
  <div class="news-card-meta">
    <span class="status-pill pill-alert">Alerta PCD</span>
    <span class="status-pill">Concurso</span>
    <time class="news-date" datetime="{TODAY_ISO}">{TODAY_STR}</time>
  </div>
  <h2 class="news-title">[titulo baseado na fonte]</h2>
  <p class="news-intro">[2 frases objetivas com o que a noticia traz, sem inventar dados]</p>
  <div class="news-body">
    <h3>O que a noticia diz</h3>
    <p>[resumo fiel ao conteudo da fonte, sem acrescentar informacoes]</p>
    <h3>Pontos de atencao para candidatos PCD</h3>
    <ul>
      <li>[ponto relevante 1, se aplicavel]</li>
      <li>[ponto relevante 2, se aplicavel]</li>
    </ul>
    <h3>Fonte</h3>
    <p>Noticia publicada por {noticia['fonte']}. <a href="{noticia['link']}" target="_blank" rel="noopener">Leia o original.</a></p>
  </div>
  <div class="news-footer">
    <span class="news-tag">[tag1]</span>
    <span class="news-tag">[tag2]</span>
  </div>
</article>
"""
    html = chamar_gemini(prompt)
    arquivo = ROOT / "noticias.html"
    wrapper = (
        f'\n<section class="section"><div class="container">'
        f'<div class="news-grid">\n{html}\n</div></div></section>\n'
    )
    if inserir_no_html(arquivo, "<!-- CONTEUDO_AUTO_NOTICIAS -->", wrapper):
        registrar_url_publicada(noticia["link"])
        print("  Noticia inserida.")


def gerar_direito_pcd():
    topico, base_legal = escolher_por_data(TOPICOS_PCD)
    print(f"Gerando Direitos PCD: {topico}")

    pauta = buscar_pauta_inclusao()
    contexto_extra = ""
    if pauta:
        contexto_extra = f"""
Existe uma noticia recente relacionada que pode enriquecer o artigo:
Fonte: {pauta['fonte']}
Link: {pauta['link']}
Conteudo: {pauta['resumo']}
Use apenas se for relevante ao topico. Cite a fonte se usar.
"""

    prompt = f"""
Voce escreve para o site Concurseira PCD, voltado para pessoas com deficiencia no Brasil.
Inspire-se no tom do Diario PCD e do Jornalista Inclusivo: humano, direto, com defesa de direitos e representatividade.
Use como base legal: gov.br, legislacao federal e TST quando aplicavel.

{REGRAS_GERAIS}

Topico: "{topico}"
Base legal: {base_legal}
{contexto_extra}

O conteudo deve ser fiel a legislacao brasileira vigente.
Nao invente numeros, valores ou procedimentos que nao existem na lei.
Se um detalhe depende de regulamentacao do municipio ou estado, indique isso claramente.

Gere este bloco HTML:

<article class="deep-card" style="margin-bottom:24px">
  <span class="status-pill">{TODAY_STR}</span>
  <h2>[titulo do artigo]</h2>
  <p>[introducao em 2 frases, tom humano e direto]</p>
  <h3>O que diz a lei</h3>
  <p>[base legal resumida com numero da lei ou decreto]</p>
  <h3>Quem tem direito</h3>
  <p>[criterios objetivos conforme a legislacao]</p>
  <h3>Como acessar</h3>
  <ol>
    <li>[passo 1]</li>
    <li>[passo 2]</li>
    <li>[passo 3]</li>
  </ol>
  <h3>Pontos de atencao</h3>
  <p>[1 ou 2 pontos que a lei exige ou que as pessoas costumam ignorar]</p>
</article>
"""
    html = chamar_gemini(prompt)
    inserir_no_html(ROOT / "direitos-pcd.html", "<!-- CONTEUDO_AUTO_DIREITOS -->", html)
    print("  Direitos PCD inserido.")


def gerar_achadinho():
    categoria = escolher_por_data(CATEGORIAS_ACHADINHOS)
    print(f"Gerando Achadinho: {categoria}")

    produto = encontrar_produto_shopee(categoria)
    bloco_produto = ""
    if produto:
        print(f"  Produto Shopee: {produto['nome']}")
        link = gerar_link_afiliada_shopee(produto["url"])
        bloco_produto = f"""
  <div class="product-cta" style="margin-top:16px;padding:14px 16px;background:#f0f7f4;border-radius:8px;border-left:4px solid #0b3d2e;">
    <p style="margin:0 0 6px;font-size:.82rem;color:#555;font-weight:600;text-transform:uppercase;letter-spacing:.04em;">Encontrado na Shopee</p>
    <a href="{link}" target="_blank" rel="noopener sponsored" style="font-weight:700;color:#0b3d2e;font-size:1rem;">{produto['nome']} &rarr;</a>
    <p style="margin:6px 0 0;font-size:.78rem;color:#888;">Link de afiliada. Sem custo adicional para voce.</p>
  </div>"""

    prompt = f"""
Voce escreve para o site Concurseira PCD, voltado para pessoas com deficiencia que estudam para concursos.

{REGRAS_GERAIS}

Escreva uma indicacao sobre: "{categoria}"

Nao invente precos, marcas especificas ou links.
Fale de caracteristicas e criterios de escolha, nao de produtos especificos.
Inclua sempre uma perspectiva de acessibilidade.

Gere este bloco HTML completo:

<article class="card" style="margin-bottom:24px">
  <span class="status-pill">{TODAY_STR}</span>
  <h3>[titulo da indicacao]</h3>
  <p>[para que serve e por que e util para quem estuda, em 2 frases]</p>
  <h4>O que observar na hora de escolher</h4>
  <ul>
    <li>[criterio 1]</li>
    <li>[criterio 2]</li>
    <li>[criterio 3]</li>
  </ul>
  <h4>Perspectiva de acessibilidade</h4>
  <p>[como esse tipo de recurso pode ajudar quem tem deficiencia fisica, visual, auditiva ou cognitiva]</p>
</article>
"""
    html = chamar_gemini(prompt)

    # Insere bloco de produto antes do fechamento do article
    if produto and "</article>" in html:
        partes = html.rsplit("</article>", 1)
        html = partes[0] + bloco_produto + "\n</article>"

    inserir_no_html(ROOT / "achadinhos.html", "<!-- CONTEUDO_AUTO_ACHADINHOS -->", html)
    print("  Achadinho inserido.")


# --- MAIN -------------------------------------------------------------------

if __name__ == "__main__":
    print(f"\nConcurseira PCD — Geracao automatica {TODAY_STR}\n")
    gerar_noticia()
    gerar_direito_pcd()
    gerar_achadinho()
    print("\nConcluido.\n")
