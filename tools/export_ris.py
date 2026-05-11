import json
import sys

def json_to_ris(data):
    """
    Convierte una lista de referencias en formato JSON al estándar RIS.
    """
    ris_output = []
    for ref in data:
        ris_output.append("TY  - JOUR") # Asumimos Journal Article por defecto
        if ref.get("official_title") or ref.get("detected_title"):
            ris_output.append(f"TI  - {ref.get('official_title') or ref.get('detected_title')}")
        
        authors = ref.get("official_authors") or ref.get("detected_authors")
        if authors:
            # RIS prefiere un autor por línea AU
            for auth in authors.split(","):
                ris_output.append(f"AU  - {auth.strip()}")
        
        if ref.get("official_journal") or ref.get("detected_journal"):
            ris_output.append(f"JO  - {ref.get('official_journal') or ref.get('detected_journal')}")
        
        if ref.get("official_year") or ref.get("detected_year"):
            ris_output.append(f"PY  - {ref.get('official_year') or ref.get('detected_year')}")
        
        if ref.get("detected_doi"):
            ris_output.append(f"DO  - {ref.get('detected_doi')}")
            ris_output.append(f"UR  - https://doi.org/{ref.get('detected_doi')}")
            
        if ref.get("abstract"):
            ris_output.append(f"AB  - {ref.get('abstract')}")
            
        ris_output.append("ER  - ") # End of Reference
        ris_output.append("")
        
    return "\n".join(ris_output)

if __name__ == "__main__":
    # Lee JSON desde stdin y saca RIS por stdout
    try:
        input_data = sys.stdin.read()
        if not input_data:
            sys.exit(0)
        references = json.loads(input_data)
        print(json_to_ris(references))
    except Exception as e:
        sys.stderr.write(f"Error: {str(e)}\n")
        sys.exit(1)
