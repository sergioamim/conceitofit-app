
export interface CepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean | string;
}

/**
 * Busca informações de endereço a partir de um CEP usando a API ViaCEP.
 * @param cep O CEP a ser buscado (apenas números ou formatado).
 * @returns Promise com o resultado da busca.
 */
export async function fetchCep(cep: string): Promise<CepResult | null> {
  const cleanCep = cep.replace(/\D/g, "");
  
  if (cleanCep.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      signal: AbortSignal.timeout(5000) // 5 seconds timeout
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.erro === true || data.erro === "true") {
      return null;
    }

    return data as CepResult;
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    return null;
  }
}
