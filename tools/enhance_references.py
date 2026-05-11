import os
import requests
import json
from typing import Optional, Dict, Any

class MedicalEvidenceEnricher:
    """
    Enriquece referencias bibliográficas con métricas de impacto y acceso abierto.
    Usa Semantic Scholar y Unpaywall.
    """
    
    SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper"
    UNPAYWALL_URL = "https://api.unpaywall.org/v2"
    EMAIL = "cacristanchoo@gmail.com" # Para Unpaywall 'polite' access

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.headers = {"x-api-key": api_key} if api_key else {}

    def get_impact_metrics(self, doi_or_pmid: str) -> Dict[str, Any]:
        """Obtiene conteo de citas e influential citations."""
        try:
            # Lógica de identificación robusta
            if doi_or_pmid.lower().startswith("pmid:"):
                identifier = doi_or_pmid
            elif doi_or_pmid.lower().startswith("doi:"):
                identifier = doi_or_pmid
            elif "/" in doi_or_pmid or doi_or_pmid.startswith("10."):
                identifier = f"DOI:{doi_or_pmid}"
            else:
                # Si es puramente numérico y corto, probablemente es PMID
                if doi_or_pmid.isdigit():
                    identifier = f"PMID:{doi_or_pmid}"
                else:
                    identifier = f"DOI:{doi_or_pmid}"

            url = f"{self.SEMANTIC_SCHOLAR_URL}/{identifier}"
            params = {"fields": "citationCount,influentialCitationCount,publicationTypes,s2FieldsOfStudy,paperId"}
            
            resp = requests.get(url, params=params, headers=self.headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "citation_count": data.get("citationCount", 0),
                    "influential_citation_count": data.get("influentialCitationCount", 0),
                    "semantic_scholar_id": data.get("paperId"),
                    "publication_types": data.get("publicationTypes", [])
                }
        except Exception as e:
            print(f"Error en Semantic Scholar ({doi_or_pmid}): {e}")
        return {}

    def get_open_access_info(self, doi: str) -> Dict[str, Any]:
        """Busca si el paper es Open Access y retorna la URL del PDF."""
        try:
            url = f"{self.UNPAYWALL_URL}/{doi}"
            params = {"email": self.EMAIL}
            resp = requests.get(url, params=params, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "is_open_access": data.get("is_oa", False),
                    "open_access_url": data.get("best_oa_location", {}).get("url_for_pdf")
                }
        except Exception as e:
            print(f"Error en Unpaywall ({doi}): {e}")
        return {}

    def enrich_reference(self, doi: Optional[str] = None, pmid: Optional[str] = None) -> Dict[str, Any]:
        """Combina ambas fuentes para enriquecer una referencia."""
        results = {}
        
        # 1. Intentar impacto
        id_to_use = doi or (f"PMID:{pmid}" if pmid else None)
        if id_to_use:
            results.update(self.get_impact_metrics(id_to_use))
            
        # 2. Intentar Open Access
        if doi:
            results.update(self.get_open_access_info(doi))
            
        return results

if __name__ == "__main__":
    # Test simple con un DOI conocido (New England Journal of Medicine)
    enricher = MedicalEvidenceEnricher()
    sample_doi = "10.1056/NEJMoa2001316" # COVID-19 drug trial
    print(f"Enriqueciendo DOI: {sample_doi}...")
    enriched_data = enricher.enrich_reference(doi=sample_doi)
    print(json.dumps(enriched_data, indent=2))
