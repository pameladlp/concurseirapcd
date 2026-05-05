"""
Concurseira PCD — Gerador automático de conteúdo diário
Gera 1 post por dia em: Noticias, Direitos PCD e Achadinhos

Regras de conteúdo:
- Noticias: apenas dados reais da fonte RSS. Sem inventar vagas, salários ou datas.
- Direitos PCD: baseado em legislação brasileira real (LBI, CF/88, INSS, etc.)
- Achadinhos: indicações genéricas e honestas, sem preços inventados.
- Proibido: travessão (--), dados inventados, afirmações sem fonte.
"""

import google.generativeai as genai
import feedparser
import os
import re
from datetime import date
from pathlib import Path

# --- CONFIG -----------------------------------------------------------------

ROOT = Path(__file__).parent.parent
TODAY = date.today()
TODAY_STR = TODAY.strftime("%d/%m/%Y")
TODAY_ISO = TODAY.isoformat()

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-1.5-flash")

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

# Concursos: noticias objetivas de editais e oportunidades
RSS_CONCURSOS = [
    "https://www.pciconcursos.com.br/rss/noticias.xml",
    "https://www.concursosnobrasil.com.br/rss.xml",
    "https://www.qconcursos.com/rss/concursos",
    "https://blog.grancursosonline.com.br/feed/",
    "https://www.estrategiaconcursos.com.br/blog/feed/",
]

# Inclusao e direitos PCD: pautas humanizadas e defesa de direitos
RSS_INCLUSAO = [
    "https://www.diariodopcd.com.br/feed/",
    "https://jornalistainclusivo.com/feed/",
]

# Fontes institucionais: base legal confiavel
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


def remover_travessao(texto: str) -> str:
    """Remove travessoes que o modelo possa ter inserido mesmo com instrucao."""
    return texto.replace("\u2014", ",").replace("\u2013", ",").replace(" -- ", ", ").replace("--", ",")


def buscar_em_feeds(feeds: list, keywords: list) -> dict | None:
    """Busca entrada relevante em uma lista de feeds RSS."""
    for url in feeds:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:20]:
                titulo = entry.get("title", "").lower()
                resumo = entry.get("summary", "").lower()
                texto_norm = (titulo + " " + resumo)
                texto_norm = texto_norm.replace("c,", "c").replace("a~", "a").replace("e^", "e")
                for c_orig, c_norm in [("ç","c"),("ã","a"),("ê","e"),("ó","o"),("á","a"),("í","i"),("ú","u"),("ô","o")]:
                    texto_norm = texto_norm.replace(c_orig, c_norm)
                if any(kw in texto_norm for kw in keywords):
                    return {
                        "titulo": entry.get("title", ""),
                        "link": entry.get("link", ""),
                        "resumo": entry.get("summary", "")[:800],
                        "fonte": feed.feed.get("title", url),
                    }
        except Exception as e:
            print(f"  RSS falhou ({url}): {e}")
            continue
    return None


def buscar_noticia_rss() -> dict | None:
    """Busca noticia real de concurso. Tenta feeds de concursos primeiro."""
    return buscar_em_feeds(RSS_CONCURSOS, KEYWORDS_RELEVANTES)


def buscar_pauta_inclusao() -> dict | None:
    """Busca pauta de inclusao e direitos PCD."""
    keywords_pcd = ["pcd", "deficiencia", "inclusao", "acessibilidade", "laudo",
                    "biopsicossocial", "bpc", "loas", "lbi", "pessoa com deficiencia"]
    return buscar_em_feeds(RSS_INCLUSAO + FONTES_LEGAIS, keywords_pcd)


def chamar_gemini(prompt: str) -> str:
    response = model.generate_content(prompt)
    texto = response.text.strip()
    # remove blocos markdown se o modelo inserir
    texto = re.sub(r"```html\n?", "", texto)
    texto = re.sub(r"```\n?", "", texto)
    # garante que nao ha travessao
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


# --- GERADORES --------------------------------------------------------------

def gerar_noticia():
    print("Gerando noticia...")
    noticia = buscar_noticia_rss()

    if not noticia:
        print("  Nenhuma noticia relevante encontrada no RSS hoje. Pulando.")
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
    wrapper = f'\n<section class="section"><div class="container"><div class="news-grid">\n{html}\n</div></div></section>\n'
    inserir_no_html(arquivo, "<!-- CONTEUDO_AUTO_NOTICIAS -->", wrapper)
    print("  Noticia inserida.")


def gerar_direito_pcd():
    topico, base_legal = escolher_por_data(TOPICOS_PCD)
    print(f"Gerando Direitos PCD: {topico}")

    # tenta buscar pauta real de fonte de inclusao ou governo
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

    prompt = f"""
Voce escreve para o site Concurseira PCD, voltado para pessoas com deficiencia que estudam para concursos.

{REGRAS_GERAIS}

Escreva uma indicacao sobre: "{categoria}"

Nao invente precos, marcas especificas ou links.
Fale de caracteristicas e criterios de escolha, nao de produtos especificos.
Inclua sempre uma perspectiva de acessibilidade.

Gere este bloco HTML:

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
    inserir_no_html(ROOT / "achadinhos.html", "<!-- CONTEUDO_AUTO_ACHADINHOS -->", html)
    print("  Achadinho inserido.")


# --- MAIN -------------------------------------------------------------------

if __name__ == "__main__":
    print(f"\nConcurseira PCD — Geracao automatica {TODAY_STR}\n")
    gerar_noticia()
    gerar_direito_pcd()
    gerar_achadinho()
    print("\nConcluido.\n")
