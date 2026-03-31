import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/lib/sanitize";

describe("sanitizeHtml", () => {
  // -----------------------------------------------------------------------
  // Tags permitidas
  // -----------------------------------------------------------------------

  describe("tags permitidas renderizam corretamente", () => {
    it("mantém tags de formatação de texto (p, b, strong, i, em, u, s, small)", () => {
      const input = "<p><b>bold</b> <strong>strong</strong> <i>italic</i> <em>em</em> <u>underline</u> <s>strike</s> <small>small</small></p>";
      expect(sanitizeHtml(input)).toBe(input);
    });

    it("mantém headings h1-h6", () => {
      const input = "<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>";
      expect(sanitizeHtml(input)).toBe(input);
    });

    it("mantém listas ul/ol/li", () => {
      const input = "<ul><li>item 1</li><li>item 2</li></ul><ol><li>item a</li></ol>";
      expect(sanitizeHtml(input)).toBe(input);
    });

    it("mantém tabelas (table, thead, tbody, tr, th, td)", () => {
      const input = "<table><thead><tr><th>Col</th></tr></thead><tbody><tr><td>Val</td></tr></tbody></table>";
      expect(sanitizeHtml(input)).toBe(input);
    });

    it("mantém div, span, hr, br", () => {
      const input = "<div><span>texto</span><hr><br></div>";
      expect(sanitizeHtml(input)).toBe(input);
    });

    it("mantém atributos class e style", () => {
      const input = '<p class="text-red" style="color: red">texto</p>';
      expect(sanitizeHtml(input)).toBe(input);
    });
  });

  // -----------------------------------------------------------------------
  // Tags proibidas
  // -----------------------------------------------------------------------

  describe("tags proibidas são removidas", () => {
    it("remove <script>", () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe("");
    });

    it("remove <iframe>", () => {
      expect(sanitizeHtml('<iframe src="https://evil.com"></iframe>')).toBe("");
    });

    it("remove <object>", () => {
      expect(sanitizeHtml('<object data="malware.swf"></object>')).toBe("");
    });

    it("remove <embed>", () => {
      expect(sanitizeHtml('<embed src="malware.swf">')).toBe("");
    });

    it("remove <form> e <input>", () => {
      const result = sanitizeHtml("<form><input></form>");
      expect(result).not.toContain("<form");
      expect(result).not.toContain("</form>");
    });

    it("remove <link> e <meta>", () => {
      expect(sanitizeHtml('<link rel="stylesheet" href="evil.css">')).toBe("");
      expect(sanitizeHtml('<meta http-equiv="refresh" content="0;url=evil">')).toBe("");
    });

    it("remove <svg> e <math>", () => {
      expect(sanitizeHtml("<svg onload=\"alert('xss')\"></svg>")).toBe("");
      expect(sanitizeHtml("<math><mi>x</mi></math>")).toBe("");
    });

    it("mantém conteúdo de texto de tags proibidas", () => {
      expect(sanitizeHtml("<script>alert('xss')</script><p>seguro</p>")).toBe("<p>seguro</p>");
    });
  });

  // -----------------------------------------------------------------------
  // Atributos maliciosos
  // -----------------------------------------------------------------------

  describe("atributos maliciosos são removidos", () => {
    it("remove onerror", () => {
      const result = sanitizeHtml('<p onerror="alert(1)">texto</p>');
      expect(result).toBe("<p>texto</p>");
    });

    it("remove onload", () => {
      const result = sanitizeHtml('<div onload="alert(1)">texto</div>');
      expect(result).toBe("<div>texto</div>");
    });

    it("remove onclick", () => {
      const result = sanitizeHtml('<span onclick="alert(1)">clique</span>');
      expect(result).toBe("<span>clique</span>");
    });

    it("remove onmouseover", () => {
      const result = sanitizeHtml('<p onmouseover="alert(1)">hover</p>');
      expect(result).toBe("<p>hover</p>");
    });

    it("remove onfocus", () => {
      const result = sanitizeHtml('<div onfocus="alert(1)">foco</div>');
      expect(result).toBe("<div>foco</div>");
    });

    it("remove atributos não permitidos (id, href, src)", () => {
      const result = sanitizeHtml('<p id="test" src="x">texto</p>');
      expect(result).not.toContain('id=');
      expect(result).not.toContain('src=');
      expect(result).toContain("texto");
    });

    it("remove href com javascript:", () => {
      // <a> não está na lista de tags permitidas, então é removida inteiramente
      const result = sanitizeHtml('<a href="javascript:alert(1)">link</a>');
      expect(result).toBe("link");
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe("edge cases", () => {
    it("retorna string vazia para input vazio", () => {
      expect(sanitizeHtml("")).toBe("");
    });

    it("retorna texto puro sem alteração", () => {
      expect(sanitizeHtml("texto simples sem HTML")).toBe("texto simples sem HTML");
    });

    it("lida com HTML malformado", () => {
      const result = sanitizeHtml("<p>aberto sem fechar<b>negrito");
      expect(result).toContain("aberto sem fechar");
      expect(result).toContain("negrito");
    });

    it("preserva entidades HTML", () => {
      const result = sanitizeHtml("<p>&amp; &lt; &gt;</p>");
      expect(result).toContain("&amp;");
      expect(result).toContain("&lt;");
      expect(result).toContain("&gt;");
    });

    it("lida com tags aninhadas maliciosas", () => {
      const result = sanitizeHtml('<div><scr<script>ipt>alert(1)</scr</script>ipt></div>');
      expect(result).not.toContain("<script");
      expect(result).not.toContain("</script>");
    });

    it("remove tentativas de bypass com encoding", () => {
      const result = sanitizeHtml('<p>&#60;script&#62;alert(1)&#60;/script&#62;</p>');
      expect(result).not.toContain("<script>");
    });

    it("lida com múltiplas tags proibidas misturadas com permitidas", () => {
      const input = '<p>ok</p><script>bad</script><h1>title</h1><ul><li>item</li></ul>';
      const result = sanitizeHtml(input);
      expect(result).toContain("<p>ok</p>");
      expect(result).toContain("<h1>title</h1>");
      expect(result).toContain("<ul><li>item</li></ul>");
      expect(result).not.toContain("<script");
    });

    it("mantém style e class mas remove outros atributos", () => {
      const result = sanitizeHtml('<div class="c" style="color:red" id="x" title="t">texto</div>');
      expect(result).toContain('class="c"');
      expect(result).toContain('style="color:red"');
      expect(result).not.toContain('id=');
      expect(result).not.toContain('title=');
    });
  });
});
