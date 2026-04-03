/**
 * Re-exporta as APIs financeiras operacionais (tenant-level) para
 * manter compatibilidade com imports existentes no backoffice.
 *
 * O código-fonte canônico está em @/lib/api/financeiro-operacional.
 */
export {
  getNfseConfiguracaoAtualApi,
  salvarNfseConfiguracaoAtualApi,
  validarNfseConfiguracaoAtualApi,
  listAgregadorTransacoesApi,
  reprocessarAgregadorTransacaoApi,
  listIntegracoesOperacionaisApi,
  reprocessarIntegracaoOperacionalApi,
} from "@/lib/api/financeiro-operacional";
