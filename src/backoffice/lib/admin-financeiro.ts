/**
 * Re-exporta helpers de domínio financeiro para manter
 * compatibilidade com imports existentes no backoffice.
 *
 * O código-fonte canônico está em @/lib/domain/financeiro.
 */
export {
  NFSE_STATUS_LABEL,
  AGREGADOR_REPASSE_LABEL,
  INTEGRACAO_STATUS_LABEL,
  NFSE_CLASSIFICACAO_TRIBUTARIA_LABEL,
  NFSE_INDICADOR_OPERACAO_LABEL,
  getNfseBloqueioMensagem,
  summarizeAgregadorTransacoes,
  summarizeRecebimentosOperacionais,
  summarizeIntegracoesOperacionais,
  createEmptyNfseConfiguracao,
  validateNfseConfiguracaoDraft,
  getNfseConfiguracaoStatus,
  buildNfseChecklist,
} from "@/lib/domain/financeiro";
