"""
Script de teste para validar os novos prompts otimizados do Pinterest
Gera imagens de exemplo para cada categoria
"""

import os
from image_creator import ImageCreator
from datetime import datetime

def test_optimized_prompts():
    """
    Testa os novos prompts fotorrealistas para cada categoria
    """
    
    print("=" * 60)
    print("TESTE DE PROMPTS OTIMIZADOS PARA PINTEREST")
    print("=" * 60)
    print()

    
    # Criar diretório de testes
    test_dir = "test_images_optimized"
    os.makedirs(test_dir, exist_ok=True)
    
    # Inicializar ImageCreator
    creator = ImageCreator()
    
    # Casos de teste por categoria
    test_cases = [
        {
            "title": "Alimentação Natural para Cães",
            "subtitle": "Nutrição balanceada e saudável",
            "category": "Nutrição",
            "filename": "01_nutricao_caes.png"
        },
        {
            "title": "Vacinação Anual de Gatos",
            "subtitle": "Proteção completa para seu felino",
            "category": "Saúde Preventiva",
            "filename": "02_vacina_gatos.png"
        },
        {
            "title": "Consulta Veterinária em Casa",
            "subtitle": "Atendimento domiciliar com qualidade",
            "category": "Saúde",
            "filename": "03_consulta_domiciliar.png"
        },
        {
            "title": "Banho e Tosa Profissional",
            "subtitle": "Higiene e beleza para seu pet",
            "category": "Higiene",
            "filename": "04_banho_tosa.png"
        },
        {
            "title": "Adestramento Positivo",
            "subtitle": "Comportamento saudável e feliz",
            "category": "Comportamento",
            "filename": "05_adestramento.png"
        },
        {
            "title": "Cuidados com Pets Idosos",
            "subtitle": "Qualidade de vida na terceira idade",
            "category": "Idosos",
            "filename": "06_pets_idosos.png"
        },
        {
            "title": "Kit de Primeiros Socorros Pet",
            "subtitle": "Esteja preparado para emergências",
            "category": "Primeiros Socorros",
            "filename": "07_primeiros_socorros.png"
        }
    ]
    
    # Gerar imagens de teste
    results = []
    for i, test in enumerate(test_cases, 1):
        print(f"\n[{i}/{len(test_cases)}] Gerando: {test['title']}")
        print(f"    Categoria: {test['category']}")
        
        output_path = os.path.join(test_dir, test['filename'])
        
        try:
            result_path = creator.create_pin_image(
                title=test['title'],
                subtitle=test['subtitle'],
                output_path=output_path,
                category=test['category']
            )
            
            results.append({
                "status": "[OK] Sucesso",
                "title": test['title'],
                "category": test['category'],
                "path": result_path
            })
            
        except Exception as e:
            results.append({
                "status": "[ERRO] Erro",
                "title": test['title'],
                "category": test['category'],
                "error": str(e)
            })
            print(f"    [ERRO] Erro: {e}")
    
    # Relatório final
    print("\n" + "=" * 60)
    print("RELATORIO DE TESTES")
    print("=" * 60)
    print()
    
    success_count = sum(1 for r in results if r['status'] == "[OK] Sucesso")
    error_count = len(results) - success_count
    
    print(f"Total de testes: {len(results)}")
    print(f"[OK] Sucessos: {success_count}")
    print(f"[ERRO] Erros: {error_count}")
    print()
    
    print("Detalhes:")
    print("-" * 60)
    for result in results:
        print(f"{result['status']} {result['category']}: {result['title']}")
        if 'path' in result:
            print(f"   [PATH] {result['path']}")
        if 'error' in result:
            print(f"   [WARN] {result['error']}")
    
    print("\n" + "=" * 60)
    print(f"[DIR] Imagens salvas em: {os.path.abspath(test_dir)}")
    print("=" * 60)
    
    # Salvar relatório
    report_path = os.path.join(test_dir, "test_report.txt")
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("RELATÓRIO DE TESTE - PROMPTS OTIMIZADOS PINTEREST\n")
        f.write(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Total de testes: {len(results)}\n")
        f.write(f"Sucessos: {success_count}\n")
        f.write(f"Erros: {error_count}\n\n")
        f.write("Detalhes:\n")
        f.write("-" * 60 + "\n")
        for result in results:
            f.write(f"{result['status']} {result['category']}: {result['title']}\n")
            if 'path' in result:
                f.write(f"   Arquivo: {result['path']}\n")
            if 'error' in result:
                f.write(f"   Erro: {result['error']}\n")
    
    print(f"\n[FILE] Relatorio salvo em: {report_path}")
    
    return results


if __name__ == "__main__":
    test_optimized_prompts()
