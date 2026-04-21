import { describe, expect, it } from "vitest";
import { computeSugestoesCliente, type SugestoesInput } from "@/lib/domain/sugestoes-cliente";
import type { Aluno } from "@/lib/shared/types";

const HOJE = new Date(2026, 3, 20); // 2026-04-20 (date local dos mocks abaixo)

function makeAluno(overrides: Partial<Aluno> = {}): Aluno {
  return {
    id: "a-1",
    tenantId: "t-1",
    nome: "Mariana Castilho",
    email: "mari@example.com",
    telefone: "11984327719",
    cpf: "31245678901",
    dataNascimento: "1994-05-12",
    sexo: "F",
    status: "ATIVO",
    dataCadastro: "2023-03-01T10:00:00",
    foto: "url://foto.jpg",
    ...overrides,
  };
}

function baseInput(overrides: Partial<SugestoesInput> = {}): SugestoesInput {
  return {
    aluno: makeAluno(),
    suspenso: false,
    acessoBloqueado: false,
    pendenteFinanceiro: false,
    planoAtivo: { dataFim: "2027-04-20" }, // 365 dias no futuro
    pagamentos: [],
    presencas: [],
    hoje: HOJE,
    ...overrides,
  };
}

describe("computeSugestoesCliente", () => {
  describe("ativo e em dia", () => {
    it("cliente ativo sem pendências, com contrato longe do vencimento, frequência alta: apenas aniversário se perto", () => {
      // Aniversário em 12/05 e hoje é 20/04 → 22 dias → sugere "parabenizar" (baixa)
      const out = computeSugestoesCliente(
        baseInput({
          presencas: Array.from({ length: 12 }, (_, i) => ({
            data: `2026-04-${String(5 + i).padStart(2, "0")}`,
          })),
        })
      );
      expect(out).toHaveLength(1);
      expect(out[0].tipo).toBe("parabens-aniversario");
      expect(out[0].prioridade).toBe("baixa");
    });

    it("cliente em dia com frequência alta e sem aniversário próximo: zero sugestões", () => {
      const out = computeSugestoesCliente(
        baseInput({
          aluno: makeAluno({ dataNascimento: "1994-10-12" }), // aniversário em outubro, longe
          presencas: Array.from({ length: 12 }, (_, i) => ({
            data: `2026-04-${String(5 + i).padStart(2, "0")}`,
          })),
        })
      );
      expect(out).toHaveLength(0);
    });
  });

  describe("risco de churn (baixa frequência)", () => {
    it("frequência mensal < 4 com plano ativo gera retenção média", () => {
      const out = computeSugestoesCliente(
        baseInput({
          presencas: [{ data: "2026-04-10" }, { data: "2026-04-15" }],
          aluno: makeAluno({ dataNascimento: "1994-10-12" }),
        })
      );
      const retencao = out.find((s) => s.tipo === "retencao-ativa");
      expect(retencao).toBeDefined();
      expect(retencao?.prioridade).toBe("media");
      expect(retencao?.descricao).toContain("2 treinos");
    });

    it("não gera retenção se cliente suspenso", () => {
      const out = computeSugestoesCliente(
        baseInput({
          suspenso: true,
          aluno: makeAluno({ status: "SUSPENSO", dataNascimento: "1994-10-12" }),
          presencas: [{ data: "2026-04-10" }],
        })
      );
      expect(out.find((s) => s.tipo === "retencao-ativa")).toBeUndefined();
    });
  });

  describe("inadimplência e contrato vencido", () => {
    it("pendência + contrato vencido produz duas sugestões alta", () => {
      const out = computeSugestoesCliente(
        baseInput({
          aluno: makeAluno({ dataNascimento: "1994-10-12" }),
          pendenteFinanceiro: true,
          planoAtivo: { dataFim: "2026-04-12" }, // venceu 8 dias antes
          pagamentos: [
            { status: "VENCIDO", dataVencimento: "2026-04-01", valor: 159.9 },
            { status: "VENCIDO", dataVencimento: "2026-04-10", valor: 159.9 },
          ],
        })
      );

      const pend = out.find((s) => s.tipo === "cobrar-pendencia");
      const renovar = out.find((s) => s.tipo === "renovar-plano");
      expect(pend?.prioridade).toBe("alta");
      expect(pend?.descricao).toContain("2 boletos");
      expect(pend?.descricao).toContain("R$");
      expect(renovar?.prioridade).toBe("alta");
      expect(renovar?.titulo).toBe("Contrato vencido");
    });
  });

  describe("renovação de plano", () => {
    it("vence em 10 dias → prioridade alta", () => {
      const out = computeSugestoesCliente(
        baseInput({
          aluno: makeAluno({ dataNascimento: "1994-10-12" }),
          planoAtivo: { dataFim: "2026-04-30" },
          presencas: Array.from({ length: 10 }, (_, i) => ({
            data: `2026-04-${String(5 + i).padStart(2, "0")}`,
          })),
        })
      );
      const renovar = out.find((s) => s.tipo === "renovar-plano");
      expect(renovar?.prioridade).toBe("alta");
      expect(renovar?.descricao).toContain("10");
    });

    it("vence em 25 dias → prioridade média", () => {
      const out = computeSugestoesCliente(
        baseInput({
          aluno: makeAluno({ dataNascimento: "1994-10-12" }),
          planoAtivo: { dataFim: "2026-05-15" },
          presencas: Array.from({ length: 10 }, (_, i) => ({
            data: `2026-04-${String(5 + i).padStart(2, "0")}`,
          })),
        })
      );
      const renovar = out.find((s) => s.tipo === "renovar-plano");
      expect(renovar?.prioridade).toBe("media");
    });

    it("sem contrato e cliente ATIVO → sugere nova contratação (alta)", () => {
      const out = computeSugestoesCliente(
        baseInput({
          aluno: makeAluno({ dataNascimento: "1994-10-12" }),
          planoAtivo: null,
        })
      );
      const sugestao = out.find((s) => s.tipo === "renovar-plano");
      expect(sugestao?.titulo).toContain("sem contrato");
      expect(sugestao?.prioridade).toBe("alta");
    });
  });

  describe("acesso bloqueado vs suspenso", () => {
    it("cliente suspenso → sugere reativar (alta)", () => {
      const out = computeSugestoesCliente(
        baseInput({
          suspenso: true,
          aluno: makeAluno({ status: "SUSPENSO", dataNascimento: "1994-10-12" }),
        })
      );
      const reativar = out.find((s) => s.tipo === "reativar-plano");
      expect(reativar?.prioridade).toBe("alta");
    });

    it("apenas bloqueio de acesso (não suspenso) → sugere liberar (alta)", () => {
      const out = computeSugestoesCliente(
        baseInput({
          acessoBloqueado: true,
          aluno: makeAluno({ dataNascimento: "1994-10-12" }),
        })
      );
      const liberar = out.find((s) => s.tipo === "liberar-acesso");
      expect(liberar).toBeDefined();
      expect(liberar?.prioridade).toBe("alta");
    });
  });

  describe("solicitar foto", () => {
    it("sem foto cadastrada → sugere trocar foto (media)", () => {
      const out = computeSugestoesCliente(
        baseInput({
          aluno: makeAluno({ foto: undefined, dataNascimento: "1994-10-12" }),
        })
      );
      const foto = out.find((s) => s.tipo === "solicitar-foto");
      expect(foto).toBeDefined();
      expect(foto?.prioridade).toBe("media");
      expect(foto?.titulo).toBe("Cliente sem foto");
    });

    it("cliente com foto cadastrada não recebe sugestão de foto", () => {
      // Desde a Task 458 os campos `fotoAptaCatraca` / `fotoMotivoInaptidao`
      // deixaram de existir em `Aluno`; a regra agora dispara apenas quando
      // `aluno.foto` está ausente.
      const out = computeSugestoesCliente(
        baseInput({
          aluno: makeAluno({
            foto: "url://foto-ok.jpg",
            dataNascimento: "1994-10-12",
          }),
        })
      );
      expect(out.find((s) => s.tipo === "solicitar-foto")).toBeUndefined();
    });
  });

  describe("ordenação por prioridade", () => {
    it("alta vem antes de média, que vem antes de baixa", () => {
      const out = computeSugestoesCliente(
        baseInput({
          pendenteFinanceiro: true,
          pagamentos: [{ status: "VENCIDO", dataVencimento: "2026-04-01", valor: 159.9 }],
          planoAtivo: { dataFim: "2026-05-15" }, // 25 dias -> media
          presencas: [{ data: "2026-04-10" }], // baixa freq -> media retencao
          aluno: makeAluno({ dataNascimento: "1994-05-10" }), // aniv em 20 dias -> baixa
        })
      );

      const prios = out.map((s) => s.prioridade);
      const altas = prios.filter((p) => p === "alta").length;
      const medias = prios.filter((p) => p === "media").length;
      const baixas = prios.filter((p) => p === "baixa").length;

      // valida que todas as altas vêm antes das médias, e todas médias antes das baixas
      const lastAlta = prios.lastIndexOf("alta");
      const firstMedia = prios.indexOf("media");
      const lastMedia = prios.lastIndexOf("media");
      const firstBaixa = prios.indexOf("baixa");

      expect(altas).toBeGreaterThan(0);
      expect(medias).toBeGreaterThan(0);
      expect(baixas).toBeGreaterThan(0);
      if (altas > 0 && medias > 0) expect(lastAlta).toBeLessThan(firstMedia);
      if (medias > 0 && baixas > 0) expect(lastMedia).toBeLessThan(firstBaixa);
    });
  });
});
